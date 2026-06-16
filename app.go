package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/cookiejar"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
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
	launchMode  string
	initialFile string
	editorMu    sync.Mutex
	editorOpen  bool
	editorPid   int
}

const DefaultServerURL = "https://ai.allrealai.com"

func NewApp() *App {
	return NewAppWithLaunchContext(apptypes.LaunchContext{})
}

func NewAppWithLaunchContext(launch apptypes.LaunchContext) *App {
	jar, _ := cookiejar.New(nil)
	httpClient := &http.Client{
		Jar:     jar,
		Timeout: 15 * time.Second,
	}
	return &App{
		client:      httpClient,
		launchMode:  launch.Mode,
		initialFile: launch.InitialFileID,
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
type Result = apptypes.Result
type ConfigFileInfo = apptypes.ConfigFileInfo
type ConfigFileContent = apptypes.ConfigFileContent
type SaveConfigFileRequest = apptypes.SaveConfigFileRequest
type LaunchContext = apptypes.LaunchContext
type ModelOption = apptypes.ModelOption
type ClaudeCodeConfigRequest = apptypes.ClaudeCodeConfigRequest
type Editor = apptypes.Editor

type configEditorProcess interface {
	Wait() error
	Pid() int
}

type execConfigEditorProcess struct {
	cmd *exec.Cmd
}

func (p execConfigEditorProcess) Wait() error {
	return p.cmd.Wait()
}

func (p execConfigEditorProcess) Pid() int {
	if p.cmd.Process == nil {
		return 0
	}
	return p.cmd.Process.Pid
}

var startConfigEditorProcess = func(fileID string) (configEditorProcess, error) {
	executable, err := os.Executable()
	if err != nil {
		return nil, fmt.Errorf("获取应用路径失败: %w", err)
	}

	cmd := exec.Command(executable, "--config-editor="+fileID)
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("打开编辑器窗口失败: %w", err)
	}
	return execConfigEditorProcess{cmd: cmd}, nil
}

var focusConfigEditorProcess = func(pid int) error {
	if pid <= 0 {
		return nil
	}
	if runtime.GOOS != "darwin" {
		return nil
	}

	script := fmt.Sprintf(`tell application "System Events" to set frontmost of first process whose unix id is %d to true`, pid)
	return exec.Command("osascript", "-e", script).Run()
}

// ---------- 服务器连接 ----------

func (a *App) CheckServer(serverURL string) (*ServerStatus, error) {
	status, normalizedURL, err := a.hub().CheckServer(serverURL)
	if err != nil {
		return nil, err
	}
	a.serverURL = normalizedURL
	return status, nil
}

func (a *App) UpdateServerURL(serverURL string) (*ServerStatus, error) {
	status, normalizedURL, err := a.hub().CheckServer(serverURL)
	if err != nil {
		return nil, err
	}
	a.serverURL = normalizedURL
	if a.accessToken != "" {
		a.saveAuth()
	}
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

func (a *App) ListConfigFiles() []ConfigFileInfo {
	return configfile.ListEditableFiles()
}

func (a *App) ReadConfigFile(id string) (*ConfigFileContent, error) {
	return configfile.ReadEditableFile(id)
}

func (a *App) SaveConfigFile(request SaveConfigFileRequest) (*Result, error) {
	return configfile.SaveEditableFile(request.ID, request.Content)
}

func (a *App) GetLaunchContext() LaunchContext {
	return LaunchContext{
		Mode:          a.launchMode,
		InitialFileID: a.initialFile,
	}
}

func (a *App) OpenConfigEditorWindow(fileID string) (*Result, error) {
	if _, err := configfile.ReadEditableFile(fileID); err != nil {
		return nil, err
	}

	a.editorMu.Lock()
	if a.editorOpen {
		pid := a.editorPid
		a.editorMu.Unlock()
		_ = focusConfigEditorProcess(pid)
		return &Result{Success: true, Message: ""}, nil
	}
	a.editorOpen = true
	a.editorMu.Unlock()

	process, err := startConfigEditorProcess(fileID)
	if err != nil {
		a.editorMu.Lock()
		a.editorOpen = false
		a.editorMu.Unlock()
		return &Result{Success: false, Message: err.Error()}, nil
	}

	a.editorMu.Lock()
	a.editorPid = process.Pid()
	a.editorMu.Unlock()

	go func() {
		_ = process.Wait()
		a.editorMu.Lock()
		a.editorOpen = false
		a.editorPid = 0
		a.editorMu.Unlock()
	}()

	return &Result{Success: true, Message: ""}, nil
}

// ---------- 状态检测 ----------

func (a *App) GetConfigStatus() *ConfigStatus {
	return statuscheck.Get()
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
