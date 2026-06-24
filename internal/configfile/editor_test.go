package configfile

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEditableFilesUseActiveDevProfile(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	t.Setenv("ALLREAL_CONFIG_PROFILE", "dev")

	files := ListEditableFiles()
	if len(files) < 3 {
		t.Fatalf("len(files) = %d, want >= 3", len(files))
	}

	wantClaudePath := filepath.Join(homeDir, ".claude", "settings-dev.json")
	if files[0].ID != "claude" {
		t.Fatalf("first file id = %q, want claude", files[0].ID)
	}
	if files[0].Path != wantClaudePath {
		t.Fatalf("claude path = %q, want %q", files[0].Path, wantClaudePath)
	}
	if files[0].Exists {
		t.Fatalf("claude file should not exist yet")
	}

	if err := os.MkdirAll(filepath.Dir(wantClaudePath), 0700); err != nil {
		t.Fatalf("creating .claude: %v", err)
	}
	if err := os.WriteFile(wantClaudePath, []byte(`{"env":{}}`), 0600); err != nil {
		t.Fatalf("writing settings-dev.json: %v", err)
	}

	content, err := ReadEditableFile("claude")
	if err != nil {
		t.Fatalf("ReadEditableFile returned error: %v", err)
	}
	if content.Path != wantClaudePath {
		t.Fatalf("content path = %q, want %q", content.Path, wantClaudePath)
	}
	if content.Content != `{"env":{}}` {
		t.Fatalf("content = %q", content.Content)
	}
}

func TestSaveEditableFileValidatesJSONAndDoesNotTouchProduction(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	t.Setenv("ALLREAL_CONFIG_PROFILE", "dev")

	productionPath := filepath.Join(homeDir, ".claude", "settings.json")
	if err := os.MkdirAll(filepath.Dir(productionPath), 0700); err != nil {
		t.Fatalf("creating .claude: %v", err)
	}
	if err := os.WriteFile(productionPath, []byte(`{"prod":true}`), 0600); err != nil {
		t.Fatalf("writing production settings.json: %v", err)
	}

	result, err := SaveEditableFile("claude", `{"env":`)
	if err != nil {
		t.Fatalf("SaveEditableFile invalid json returned error: %v", err)
	}
	if result.Success {
		t.Fatalf("invalid JSON save succeeded")
	}
	if !strings.Contains(result.Message, "JSON") {
		t.Fatalf("invalid JSON message = %q", result.Message)
	}

	result, err = SaveEditableFile("claude", `{"env":{"ANTHROPIC_BASE_URL":"https://ai.allrealai.com"}}`)
	if err != nil {
		t.Fatalf("SaveEditableFile valid json returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("valid JSON save failed: %s", result.Message)
	}

	devData, err := os.ReadFile(filepath.Join(homeDir, ".claude", "settings-dev.json"))
	if err != nil {
		t.Fatalf("reading settings-dev.json: %v", err)
	}
	if string(devData) != `{"env":{"ANTHROPIC_BASE_URL":"https://ai.allrealai.com"}}` {
		t.Fatalf("dev data = %q", devData)
	}
	prodData, err := os.ReadFile(productionPath)
	if err != nil {
		t.Fatalf("reading production settings.json: %v", err)
	}
	if string(prodData) != `{"prod":true}` {
		t.Fatalf("production settings changed: %s", prodData)
	}
}

func TestSaveEditableFileValidatesTOMLAndRejectsUnknownID(t *testing.T) {
	homeDir := t.TempDir()
	t.Setenv("HOME", homeDir)
	t.Setenv("USERPROFILE", homeDir)
	t.Setenv("ALLREAL_CONFIG_PROFILE", "dev")

	result, err := SaveEditableFile("codex-config", `model_provider = `)
	if err != nil {
		t.Fatalf("SaveEditableFile invalid toml returned error: %v", err)
	}
	if result.Success {
		t.Fatalf("invalid TOML save succeeded")
	}
	if !strings.Contains(result.Message, "TOML") {
		t.Fatalf("invalid TOML message = %q", result.Message)
	}

	result, err = SaveEditableFile("codex-config", `model_provider = "allreal"`)
	if err != nil {
		t.Fatalf("SaveEditableFile valid toml returned error: %v", err)
	}
	if !result.Success {
		t.Fatalf("valid TOML save failed: %s", result.Message)
	}

	if _, err := ReadEditableFile("missing"); err == nil {
		t.Fatalf("ReadEditableFile unknown id returned nil error")
	}
	if _, err := SaveEditableFile("missing", "{}"); err == nil {
		t.Fatalf("SaveEditableFile unknown id returned nil error")
	}
}
