package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"os"
	"path/filepath"
	"strings"
	"time"

	"allreal-config/internal/apptypes"
	"allreal-config/internal/configfile"
	"allreal-config/internal/editor"
	"allreal-config/internal/hubclient"
	"allreal-config/internal/statuscheck"
)

type App struct {
	ctx         context.Context
	client      *http.Client
	serverURL   string
	accessToken string
	tokenPath   string
	userID      int
}

func NewApp() *App {
	jar, _ := cookiejar.New(nil)
	httpClient := &http.Client{
		Jar:     jar,
		Timeout: 15 * time.Second,
	}
	return &App{
		client: httpClient,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.tokenPath = filepath.Join(configfile.UserConfigDir(), "allreal-config", "auth.json")
	a.loadSavedAuth()
}

func (a *App) shutdown(ctx context.Context) {}

func (a *App) hub() *hubclient.Client {
	return hubclient.New(a.client, a.serverURL)
}

// ---------- 数据结构 ----------

type APIResponse = apptypes.APIResponse
type ServerStatus = apptypes.ServerStatus
type UserInfo = apptypes.UserInfo
type TokenItem = apptypes.TokenItem
type TokenListResponse = apptypes.TokenListResponse
type SavedAuth = apptypes.SavedAuth

type ConfigStatus = apptypes.ConfigStatus
type ConfigState = apptypes.ConfigState
type CCSwitch = apptypes.CCSwitch
type Result = apptypes.Result
type ModelOption = apptypes.ModelOption
type ClaudeCodeConfigRequest = apptypes.ClaudeCodeConfigRequest
type Editor = apptypes.Editor

// ---------- 服务器连接 ----------

func (a *App) CheckServer(serverURL string) (*ServerStatus, error) {
	status, normalizedURL, err := a.hub().CheckServer(serverURL)
	if err != nil {
		return nil, err
	}
	a.serverURL = normalizedURL
	return status, nil
}

// ---------- 登录 ----------

func (a *App) Login(serverURL, username, password string) (*UserInfo, error) {
	serverURL = strings.TrimRight(serverURL, "/")
	a.serverURL = serverURL
	user, err := a.hub().Login(username, password)
	if err != nil {
		return nil, err
	}
	a.userID = user.ID

	// 生成 access token 用于持久化认证
	if err := a.generateAccessToken(); err != nil {
		return nil, fmt.Errorf("获取 access token 失败: %v", err)
	}

	a.saveAuth()
	return user, nil
}

func (a *App) generateAccessToken() error {
	token, err := a.hub().GenerateAccessToken(a.userID)
	if err != nil {
		return err
	}
	a.accessToken = token
	return nil
}

func (a *App) IsLoggedIn() bool {
	return a.accessToken != "" && a.serverURL != ""
}

func (a *App) Logout() {
	a.accessToken = ""
	a.serverURL = ""
	os.Remove(a.tokenPath)
}

func (a *App) GetServerURL() string {
	return a.serverURL
}

// ---------- 令牌管理 ----------

func (a *App) GetTokens() (*TokenListResponse, error) {
	return a.hub().GetTokens(a.accessToken, a.userID)
}

func (a *App) RevealTokenKey(tokenID int) (string, error) {
	return a.hub().RevealTokenKey(tokenID, a.accessToken, a.userID)
}

// ---------- 配置 Claude Code ----------

func (a *App) GetClaudeCodeModels(tokenKey string) ([]ModelOption, error) {
	return a.hub().GetClaudeCodeModels(tokenKey)
}

func (a *App) ConfigureClaudeCode(config ClaudeCodeConfigRequest) (*Result, error) {
	return configfile.WriteClaudeCode(a.serverURL, config)
}

// ---------- 配置 CodeX ----------

func (a *App) ConfigureCodex(tokenKey string) (*Result, error) {
	return configfile.WriteCodex(a.serverURL, tokenKey)
}

func (a *App) GetAvailableEditors() []Editor {
	return editor.AvailableEditors()
}

func (a *App) OpenConfigFile(target string, editorID string) error {
	return editor.OpenConfigFile(target, editorID)
}

// ---------- 状态检测 ----------

func (a *App) GetConfigStatus() *ConfigStatus {
	return statuscheck.Get()
}

func (a *App) UninstallCCSwitch() (*Result, error) {
	return statuscheck.UninstallCCSwitch()
}

// ---------- 工具函数 ----------

func (a *App) saveAuth() {
	os.MkdirAll(filepath.Dir(a.tokenPath), 0700)
	auth := SavedAuth{
		ServerURL:   a.serverURL,
		AccessToken: a.accessToken,
		UserID:      a.userID,
	}
	data, _ := json.Marshal(auth)
	os.WriteFile(a.tokenPath, data, 0600)
}

func (a *App) loadSavedAuth() {
	data, err := os.ReadFile(a.tokenPath)
	if err != nil {
		return
	}
	var auth SavedAuth
	if json.Unmarshal(data, &auth) == nil {
		a.serverURL = auth.ServerURL
		a.accessToken = auth.AccessToken
		a.userID = auth.UserID
	}
}
