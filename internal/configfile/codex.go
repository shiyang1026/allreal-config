package configfile

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"allreal-config/internal/apptypes"
)

func CodexConfigPath() string {
	return ActivePaths().CodexConfig
}

func CodexAuthPath() string {
	return ActivePaths().CodexAuth
}

func WriteCodex(serverURL string, config apptypes.CodexConfigRequest) (*apptypes.Result, error) {
	required := map[string]string{
		"令牌": config.AuthToken,
		"模型": config.Model,
	}
	for label, value := range required {
		if strings.TrimSpace(value) == "" {
			return &apptypes.Result{Success: false, Message: "请选择" + label}, nil
		}
	}

	reasoningEffort := strings.TrimSpace(config.ReasoningEffort)
	if reasoningEffort == "" {
		reasoningEffort = "high"
	}

	configPath := CodexConfigPath()
	if err := os.MkdirAll(filepath.Dir(configPath), 0700); err != nil {
		return &apptypes.Result{Success: false, Message: "创建目录失败: " + err.Error()}, nil
	}

	if err := backupFile(configPath); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份失败: " + err.Error()}, nil
	}

	configContent := fmt.Sprintf(`model_provider = "allreal"
model = "%s"
model_reasoning_effort = "%s"

[model_providers.allreal]
name = "allreal"
base_url = "%s/v1"
wire_api = "responses"
requires_openai_auth = true
`, strings.TrimSpace(config.Model), reasoningEffort, strings.TrimRight(serverURL, "/"))

	if err := os.WriteFile(configPath, []byte(configContent), 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入失败: " + err.Error()}, nil
	}

	authPath := CodexAuthPath()
	if err := backupFile(authPath); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份 auth.json 失败: " + err.Error()}, nil
	}
	authData := map[string]string{"OPENAI_API_KEY": config.AuthToken}
	authJSON, _ := json.MarshalIndent(authData, "", "  ")
	if err := os.WriteFile(authPath, authJSON, 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入 auth.json 失败: " + err.Error()}, nil
	}

	return &apptypes.Result{Success: true, Message: "CodeX 配置成功"}, nil
}
