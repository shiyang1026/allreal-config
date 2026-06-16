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

func WriteCodex(serverURL string, tokenKey string) (*apptypes.Result, error) {
	configPath := CodexConfigPath()
	if err := os.MkdirAll(filepath.Dir(configPath), 0700); err != nil {
		return &apptypes.Result{Success: false, Message: "创建目录失败: " + err.Error()}, nil
	}

	if err := backupFile(configPath); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份失败: " + err.Error()}, nil
	}

	configContent := fmt.Sprintf(`model_provider = "allreal"
model = "gpt-5.5"
model_reasoning_effort = "high"

[model_providers.allreal]
name = "allreal"
base_url = "%s/v1"
wire_api = "responses"
`, strings.TrimRight(serverURL, "/"))

	if err := os.WriteFile(configPath, []byte(configContent), 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入失败: " + err.Error()}, nil
	}

	authPath := CodexAuthPath()
	if err := backupFile(authPath); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份 auth.json 失败: " + err.Error()}, nil
	}
	authData := map[string]string{"OPENAI_API_KEY": tokenKey}
	authJSON, _ := json.MarshalIndent(authData, "", "  ")
	if err := os.WriteFile(authPath, authJSON, 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入 auth.json 失败: " + err.Error()}, nil
	}

	return &apptypes.Result{Success: true, Message: "CodeX 配置成功"}, nil
}
