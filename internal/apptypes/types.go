package apptypes

import "encoding/json"

type APIResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type ServerStatus struct {
	SystemName    string `json:"system_name"`
	Version       string `json:"version"`
	ServerAddress string `json:"server_address"`
}

type UserInfo struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Role        int    `json:"role"`
	Status      int    `json:"status"`
	Group       string `json:"group"`
}

type TokenItem struct {
	ID                int    `json:"id"`
	Name              string `json:"name"`
	Key               string `json:"key"`
	Status            int    `json:"status"`
	RemainQuota       int64  `json:"remain_quota"`
	UnlimitedQuota    bool   `json:"unlimited_quota"`
	ExpiredTime       int64  `json:"expired_time"`
	UsedQuota         int64  `json:"used_quota"`
	ModelLimitsEnable bool   `json:"model_limits_enabled"`
}

type TokenListResponse struct {
	Items    []TokenItem `json:"items"`
	Total    int         `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

type SavedAuth struct {
	ServerURL   string `json:"server_url"`
	AccessToken string `json:"access_token"`
	UserID      int    `json:"user_id"`
}

type ConfigStatus struct {
	ClaudeCode ConfigState `json:"claude_code"`
	Codex      ConfigState `json:"codex"`
}

type ConfigState struct {
	Configured bool   `json:"configured"`
	BaseURL    string `json:"base_url"`
	HasKey     bool   `json:"has_key"`
}

type Result struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type ConfigFileInfo struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Path     string `json:"path"`
	Language string `json:"language"`
	Exists   bool   `json:"exists"`
}

type ConfigFileContent struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Path     string `json:"path"`
	Language string `json:"language"`
	Content  string `json:"content"`
}

type SaveConfigFileRequest struct {
	ID      string `json:"id"`
	Content string `json:"content"`
}

type LaunchContext struct {
	Mode          string `json:"mode"`
	InitialFileID string `json:"initial_file_id"`
}

type ModelOption struct {
	ID          string `json:"id"`
	DisplayName string `json:"display_name"`
}

type ClaudeCodeConfigRequest struct {
	AuthToken     string `json:"auth_token"`
	HaikuModel    string `json:"haiku_model"`
	SonnetModel   string `json:"sonnet_model"`
	OpusModel     string `json:"opus_model"`
	SubagentModel string `json:"subagent_model"`
}

type CodexConfigRequest struct {
	AuthToken       string `json:"auth_token"`
	Model           string `json:"model"`
	ReasoningEffort string `json:"reasoning_effort"`
}

type Editor struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
