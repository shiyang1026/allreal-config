package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"allreal-config/internal/configfile"
)

func TestConfigureCodexWritesSelectedProviderAndOpenAIKey(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)

	app := NewApp()
	app.serverURL = "https://cn.allrealai.com"

	result, err := app.ConfigureCodex(CodexConfigRequest{
		AuthToken:       "sk-user-token",
		Model:           "gpt-5.5",
		ReasoningEffort: "high",
	})
	if err != nil {
		t.Fatalf("ConfigureCodex returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("ConfigureCodex failed: %s", result.Message)
	}

	configData, err := os.ReadFile(filepath.Join(homeDir, ".codex", "config.toml"))
	if err != nil {
		t.Fatalf("reading config.toml: %v", err)
	}
	config := string(configData)
	wantConfigParts := []string{
		`model_provider = "allreal"`,
		`model = "gpt-5.5"`,
		`model_reasoning_effort = "high"`,
		`[model_providers.allreal]`,
		`name = "allreal"`,
		`base_url = "https://cn.allrealai.com/v1"`,
		`wire_api = "responses"`,
		`requires_openai_auth = true`,
	}
	for _, part := range wantConfigParts {
		if !strings.Contains(config, part) {
			t.Fatalf("config.toml missing %q:\n%s", part, config)
		}
	}
	if strings.Contains(config, "env_key") {
		t.Fatalf("config.toml should not contain env_key:\n%s", config)
	}

	authData, err := os.ReadFile(filepath.Join(homeDir, ".codex", "auth.json"))
	if err != nil {
		t.Fatalf("reading auth.json: %v", err)
	}
	var auth map[string]string
	if err := json.Unmarshal(authData, &auth); err != nil {
		t.Fatalf("auth.json is invalid JSON: %v", err)
	}
	if auth["OPENAI_API_KEY"] != "sk-user-token" {
		t.Fatalf("OPENAI_API_KEY = %q, want sk-user-token", auth["OPENAI_API_KEY"])
	}
	if _, ok := auth["ALLREAL_API_KEY"]; ok {
		t.Fatalf("auth.json should not contain ALLREAL_API_KEY: %v", auth)
	}
}

func TestGetConfigStatusDetectsCodexOpenAIKey(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	codexDir := filepath.Join(homeDir, ".codex")
	if err := os.MkdirAll(codexDir, 0700); err != nil {
		t.Fatalf("creating .codex: %v", err)
	}

	config := `model_provider = "allreal"
model = "gpt-5.5"
model_reasoning_effort = "high"

[model_providers.allreal]
name = "allreal"
base_url = "https://ai.allrealai.com/v1"
wire_api = "responses"
`
	if err := os.WriteFile(filepath.Join(codexDir, "config.toml"), []byte(config), 0600); err != nil {
		t.Fatalf("writing config.toml: %v", err)
	}
	auth := []byte(`{"OPENAI_API_KEY":"sk-user-token"}`)
	if err := os.WriteFile(filepath.Join(codexDir, "auth.json"), auth, 0600); err != nil {
		t.Fatalf("writing auth.json: %v", err)
	}

	status := NewApp().GetConfigStatus()
	if !status.Codex.Configured {
		t.Fatalf("Codex.Configured = false, want true")
	}
	if status.Codex.BaseURL != "https://ai.allrealai.com/v1" {
		t.Fatalf("Codex.BaseURL = %q", status.Codex.BaseURL)
	}
	if !status.Codex.HasKey {
		t.Fatalf("Codex.HasKey = false, want true")
	}
}

func TestGetConfigStatusOmitsCCSwitch(t *testing.T) {
	status := NewApp().GetConfigStatus()
	data, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("marshaling status: %v", err)
	}
	if strings.Contains(string(data), "cc_switch") {
		t.Fatalf("config status should not expose cc_switch: %s", data)
	}
}

func TestConfigureClaudeCodeResetsSettingsWithSelectedModels(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	claudeDir := filepath.Join(homeDir, ".claude")
	if err := os.MkdirAll(claudeDir, 0700); err != nil {
		t.Fatalf("creating .claude: %v", err)
	}
	existing := []byte(`{"hooks":{"Stop":[]},"permissions":{"allow":["Bash(date)"]},"env":{"OLD":"value"}}`)
	if err := os.WriteFile(filepath.Join(claudeDir, "settings.json"), existing, 0600); err != nil {
		t.Fatalf("writing existing settings.json: %v", err)
	}

	app := NewApp()
	app.serverURL = "https://ai.allrealai.com"
	result, err := app.ConfigureClaudeCode(ClaudeCodeConfigRequest{
		AuthToken:     "sk-user-token",
		HaikuModel:    "claude-haiku-choice",
		SonnetModel:   "claude-sonnet-choice",
		OpusModel:     "gpt-opus-choice",
		SubagentModel: "gpt-subagent-choice",
	})
	if err != nil {
		t.Fatalf("ConfigureClaudeCode returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("ConfigureClaudeCode failed: %s", result.Message)
	}

	data, err := os.ReadFile(filepath.Join(claudeDir, "settings.json"))
	if err != nil {
		t.Fatalf("reading settings.json: %v", err)
	}
	var settings map[string]any
	if err := json.Unmarshal(data, &settings); err != nil {
		t.Fatalf("settings.json is invalid JSON: %v", err)
	}
	if settings["hooks"] != nil || settings["permissions"] != nil {
		t.Fatalf("settings.json should be reset, got preserved fields: %s", data)
	}
	if completed, ok := settings["hasCompletedOnboarding"].(bool); !ok || !completed {
		t.Fatalf("hasCompletedOnboarding = %v, want true", settings["hasCompletedOnboarding"])
	}
	env, ok := settings["env"].(map[string]any)
	if !ok {
		t.Fatalf("env missing or invalid: %s", data)
	}
	wantEnv := map[string]string{
		"ANTHROPIC_AUTH_TOKEN":                     "sk-user-token",
		"ANTHROPIC_BASE_URL":                       "https://ai.allrealai.com",
		"ANTHROPIC_DEFAULT_HAIKU_MODEL":            "claude-haiku-choice",
		"ANTHROPIC_DEFAULT_SONNET_MODEL":           "claude-sonnet-choice",
		"ANTHROPIC_DEFAULT_OPUS_MODEL":             "gpt-opus-choice",
		"CLAUDE_CODE_SUBAGENT_MODEL":               "gpt-subagent-choice",
		"CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS":   "1",
		"CLAUDE_CODE_ATTRIBUTION_HEADER":           "0",
		"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
	}
	for key, want := range wantEnv {
		if got, _ := env[key].(string); got != want {
			t.Fatalf("env[%s] = %q, want %q in %s", key, got, want, data)
		}
	}
}

func TestConfigureClaudeCodeDevProfileWritesDevSettingsWithoutTouchingProduction(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	t.Setenv("ALLREAL_CONFIG_PROFILE", "dev")
	claudeDir := filepath.Join(homeDir, ".claude")
	if err := os.MkdirAll(claudeDir, 0700); err != nil {
		t.Fatalf("creating .claude: %v", err)
	}
	productionSettings := []byte(`{"env":{"ANTHROPIC_AUTH_TOKEN":"sk-existing"}}`)
	productionPath := filepath.Join(claudeDir, "settings.json")
	if err := os.WriteFile(productionPath, productionSettings, 0600); err != nil {
		t.Fatalf("writing production settings.json: %v", err)
	}

	app := NewApp()
	app.serverURL = "https://ai.allrealai.com"
	result, err := app.ConfigureClaudeCode(ClaudeCodeConfigRequest{
		AuthToken:     "sk-dev-token",
		HaikuModel:    "claude-haiku-dev",
		SonnetModel:   "claude-sonnet-dev",
		OpusModel:     "claude-opus-dev",
		SubagentModel: "claude-sonnet-dev",
	})
	if err != nil {
		t.Fatalf("ConfigureClaudeCode returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("ConfigureClaudeCode failed: %s", result.Message)
	}

	devData, err := os.ReadFile(filepath.Join(claudeDir, "settings-dev.json"))
	if err != nil {
		t.Fatalf("reading settings-dev.json: %v", err)
	}
	var devSettings map[string]any
	if err := json.Unmarshal(devData, &devSettings); err != nil {
		t.Fatalf("settings-dev.json is invalid JSON: %v", err)
	}
	env := devSettings["env"].(map[string]any)
	if env["ANTHROPIC_AUTH_TOKEN"] != "sk-dev-token" {
		t.Fatalf("dev ANTHROPIC_AUTH_TOKEN = %v", env["ANTHROPIC_AUTH_TOKEN"])
	}
	prodData, err := os.ReadFile(productionPath)
	if err != nil {
		t.Fatalf("reading production settings.json: %v", err)
	}
	if string(prodData) != string(productionSettings) {
		t.Fatalf("production settings.json changed:\n%s", prodData)
	}
	if got := configfile.ActivePaths().ClaudeSettings; got != filepath.Join(claudeDir, "settings-dev.json") {
		t.Fatalf("ClaudeSettings path = %q", got)
	}
}

func TestGetClaudeCodeModelsUsesSelectedTokenAgainstAnthropicModelsEndpoint(t *testing.T) {
	var gotAPIKey string
	var gotAnthropicVersion string
	client := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Path != "/v1/models" {
			t.Fatalf("path = %s, want /v1/models", r.URL.Path)
		}
		gotAPIKey = r.Header.Get("x-api-key")
		gotAnthropicVersion = r.Header.Get("anthropic-version")
		body := []byte(`{
			"data": [
				{"id": "claude-sonnet-4-6", "display_name": "Claude Sonnet"},
				{"id": "gpt-5.4", "display_name": "gpt-5.4"}
			]
		}`)
		return &http.Response{
			StatusCode: http.StatusOK,
			Header:     make(http.Header),
			Body:       io.NopCloser(bytes.NewReader(body)),
			Request:    r,
		}, nil
	})}

	app := NewApp()
	app.client = client
	app.serverURL = "https://ai.allrealai.com"
	models, err := app.GetClaudeCodeModels("sk-selected-token")
	if err != nil {
		t.Fatalf("GetClaudeCodeModels returned error: %v", err)
	}
	if gotAPIKey != "sk-selected-token" {
		t.Fatalf("x-api-key = %q, want sk-selected-token", gotAPIKey)
	}
	if gotAnthropicVersion == "" {
		t.Fatalf("anthropic-version header was not set")
	}
	if len(models) != 2 {
		t.Fatalf("len(models) = %d, want 2: %#v", len(models), models)
	}
	if models[0].ID != "claude-sonnet-4-6" || models[1].ID != "gpt-5.4" {
		t.Fatalf("models = %#v", models)
	}
}

func TestOpenConfigEditorWindowAllowsOnlyOneRunningEditor(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	t.Setenv("ALLREAL_CONFIG_PROFILE", "dev")

	oldStarter := startConfigEditorProcess
	oldFocuser := focusConfigEditorProcess
	defer func() {
		startConfigEditorProcess = oldStarter
		focusConfigEditorProcess = oldFocuser
	}()

	started := 0
	focusedPID := 0
	release := make(chan struct{})
	waited := make(chan struct{})
	startConfigEditorProcess = func(fileID string) (configEditorProcess, error) {
		started++
		if started > 1 {
			return fakeConfigEditorProcess{pid: 1000 + started, wait: func() error {
				select {}
			}}, nil
		}
		return fakeConfigEditorProcess{pid: 1001, wait: func() error {
			<-release
			close(waited)
			return nil
		}}, nil
	}
	focusConfigEditorProcess = func(pid int) error {
		focusedPID = pid
		return nil
	}

	app := NewApp()
	result, err := app.OpenConfigEditorWindow("claude")
	if err != nil {
		t.Fatalf("OpenConfigEditorWindow returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("first open failed: %s", result.Message)
	}
	if started != 1 {
		t.Fatalf("started = %d, want 1", started)
	}

	result, err = app.OpenConfigEditorWindow("codex-config")
	if err != nil {
		t.Fatalf("second OpenConfigEditorWindow returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("second open should focus existing editor: %s", result.Message)
	}
	if result.Message != "" {
		t.Fatalf("second open message = %q, want empty implicit focus result", result.Message)
	}
	if started != 1 {
		t.Fatalf("second open started another editor, started = %d", started)
	}
	if focusedPID != 1001 {
		t.Fatalf("focusedPID = %d, want 1001", focusedPID)
	}

	close(release)
	<-waited
	deadline := time.Now().Add(time.Second)
	for {
		result, err = app.OpenConfigEditorWindow("codex-config")
		if err != nil {
			t.Fatalf("third OpenConfigEditorWindow returned error: %v", err)
		}
		if result.Success && started == 2 {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("editor slot was not released, result=%+v started=%d", result, started)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

type fakeConfigEditorProcess struct {
	pid  int
	wait func() error
}

func (p fakeConfigEditorProcess) Pid() int {
	return p.pid
}

func (p fakeConfigEditorProcess) Wait() error {
	return p.wait()
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return fn(req)
}
