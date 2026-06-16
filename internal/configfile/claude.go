package configfile

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"allreal-config/internal/apptypes"
)

func ClaudeSettingsPath() string {
	return ActivePaths().ClaudeSettings
}

func WriteClaudeCode(serverURL string, config apptypes.ClaudeCodeConfigRequest) (*apptypes.Result, error) {
	required := map[string]string{
		"令牌":          config.AuthToken,
		"Haiku 模型":    config.HaikuModel,
		"Sonnet 模型":   config.SonnetModel,
		"Opus 模型":     config.OpusModel,
		"Subagent 模型": config.SubagentModel,
	}
	for label, value := range required {
		if strings.TrimSpace(value) == "" {
			return &apptypes.Result{Success: false, Message: "请选择" + label}, nil
		}
	}

	settingsPath := ClaudeSettingsPath()
	if err := os.MkdirAll(filepath.Dir(settingsPath), 0700); err != nil {
		return &apptypes.Result{Success: false, Message: "创建目录失败: " + err.Error()}, nil
	}

	if err := backupFile(settingsPath); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份失败: " + err.Error()}, nil
	}

	env := map[string]string{
		"ANTHROPIC_AUTH_TOKEN":                     strings.TrimSpace(config.AuthToken),
		"ANTHROPIC_BASE_URL":                       strings.TrimRight(serverURL, "/"),
		"ANTHROPIC_DEFAULT_HAIKU_MODEL":            strings.TrimSpace(config.HaikuModel),
		"ANTHROPIC_DEFAULT_SONNET_MODEL":           strings.TrimSpace(config.SonnetModel),
		"ANTHROPIC_DEFAULT_OPUS_MODEL":             strings.TrimSpace(config.OpusModel),
		"CLAUDE_CODE_SUBAGENT_MODEL":               strings.TrimSpace(config.SubagentModel),
		"CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS":   "1",
		"CLAUDE_CODE_ATTRIBUTION_HEADER":           "0",
		"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
	}
	settings := map[string]interface{}{
		"hasCompletedOnboarding": true,
		"env":                    env,
	}

	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("serializing Claude Code settings: %w", err)
	}
	if err := os.WriteFile(settingsPath, data, 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入失败: " + err.Error()}, nil
	}

	return &apptypes.Result{Success: true, Message: "Claude Code 配置成功"}, nil
}
