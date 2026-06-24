package statuscheck

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"

	"allreal-config/internal/apptypes"
	"allreal-config/internal/configfile"
	"allreal-config/internal/envscan"

	"github.com/BurntSushi/toml"
)

var allrealDomains = []string{"ai.allrealai.com", "cn.allrealai.com"}

func Get() *apptypes.ConfigStatus {
	status := &apptypes.ConfigStatus{}
	readClaudeStatus(status)
	readCodexStatus(status)
	status.ShellConflicts = envscan.Scan()
	return status
}

func readClaudeStatus(status *apptypes.ConfigStatus) {
	if data, err := os.ReadFile(configfile.ClaudeSettingsPath()); err == nil {
		var settings map[string]interface{}
		if json.Unmarshal(data, &settings) == nil {
			if env, ok := settings["env"].(map[string]interface{}); ok {
				if baseURL, ok := env["ANTHROPIC_BASE_URL"].(string); ok && isAllRealURL(baseURL) {
					status.ClaudeCode.Configured = true
					status.ClaudeCode.BaseURL = baseURL
				}
				if _, ok := env["ANTHROPIC_AUTH_TOKEN"].(string); ok {
					status.ClaudeCode.HasKey = true
				}
			}
		}
	}
}

func readCodexStatus(status *apptypes.ConfigStatus) {
	if data, err := os.ReadFile(configfile.CodexConfigPath()); err == nil {
		var codexConfig map[string]interface{}
		if toml.Unmarshal(data, &codexConfig) == nil {
			if providers, ok := codexConfig["model_providers"].(map[string]interface{}); ok {
				for _, v := range providers {
					if p, ok := v.(map[string]interface{}); ok {
						if baseURL, ok := p["base_url"].(string); ok && isAllRealURL(baseURL) {
							status.Codex.Configured = true
							status.Codex.BaseURL = baseURL
							readCodexAuthStatus(status)
							break
						}
					}
				}
			}
			if !status.Codex.Configured {
				if baseURL, ok := codexConfig["openai_base_url"].(string); ok && isAllRealURL(baseURL) {
					status.Codex.Configured = true
					status.Codex.BaseURL = baseURL
				}
			}
		}
	}
}

func readCodexAuthStatus(status *apptypes.ConfigStatus) {
	if authData, err := os.ReadFile(configfile.CodexAuthPath()); err == nil {
		var auth map[string]string
		if json.Unmarshal(authData, &auth) == nil {
			if auth["OPENAI_API_KEY"] != "" {
				status.Codex.HasKey = true
			}
		}
	}
}

func isAllRealURL(u string) bool {
	for _, d := range allrealDomains {
		if strings.Contains(u, d) {
			return true
		}
	}
	return false
}

func ClaudeSettingsPathForHome(homeDir string) string {
	return filepath.Join(homeDir, ".claude", "settings.json")
}
