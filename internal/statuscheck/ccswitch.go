package statuscheck

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"allreal-config/internal/apptypes"
	"allreal-config/internal/configfile"
)

func DetectCCSwitch() apptypes.CCSwitch {
	result := apptypes.CCSwitch{}
	for _, p := range ccSwitchCandidates() {
		if _, err := os.Stat(p); err == nil {
			result.Installed = true
			result.Paths = append(result.Paths, p)
		}
	}

	if data, err := os.ReadFile(configfile.ClaudeSettingsPath()); err == nil {
		var settings map[string]interface{}
		if json.Unmarshal(data, &settings) == nil {
			expectedFields := []string{"hooks", "enabledPlugins", "permissions", "statusLine"}
			for _, field := range expectedFields {
				if _, ok := settings[field]; !ok {
					result.Polluted = true
					result.PollutedInfo = append(result.PollutedInfo, fmt.Sprintf("缺失字段: %s", field))
				}
			}
		}
	}

	return result
}

func UninstallCCSwitch() (*apptypes.Result, error) {
	var removed []string
	for _, p := range ccSwitchCandidates() {
		if _, err := os.Stat(p); err == nil {
			if err := os.RemoveAll(p); err == nil {
				removed = append(removed, p)
			}
		}
	}

	if len(removed) == 0 {
		return &apptypes.Result{Success: true, Message: "未检测到 cc-switch 安装"}, nil
	}

	return &apptypes.Result{
		Success: true,
		Message: fmt.Sprintf("已清理 %d 个路径: %s", len(removed), strings.Join(removed, ", ")),
	}, nil
}

func ccSwitchCandidates() []string {
	homeDir, _ := os.UserHomeDir()
	switch runtime.GOOS {
	case "darwin":
		return []string{
			"/Applications/cc-switch.app",
			filepath.Join(homeDir, "Applications", "cc-switch.app"),
			filepath.Join(homeDir, "Library", "Application Support", "cc-switch"),
			filepath.Join(homeDir, "Library", "Caches", "cc-switch"),
		}
	case "windows":
		appData := os.Getenv("APPDATA")
		localAppData := os.Getenv("LOCALAPPDATA")
		return []string{
			filepath.Join(localAppData, "Programs", "cc-switch"),
			filepath.Join(appData, "cc-switch"),
			filepath.Join(localAppData, "cc-switch"),
		}
	default:
		return nil
	}
}
