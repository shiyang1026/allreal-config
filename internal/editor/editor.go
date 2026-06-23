package editor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"allreal-config/internal/apptypes"
	"allreal-config/internal/configfile"
)

var knownEditors = []struct {
	id     string
	name   string
	cmd    string
	macApp string
}{
	{"code", "VS Code", "code", "Visual Studio Code"},
	{"cursor", "Cursor", "cursor", "Cursor"},
	{"windsurf", "Windsurf", "windsurf", "Windsurf"},
	{"subl", "Sublime Text", "subl", "Sublime Text"},
	{"zed", "Zed", "zed", "Zed"},
	{"idea", "IntelliJ IDEA", "idea", "IntelliJ IDEA"},
	{"goland", "GoLand", "goland", "GoLand"},
	{"webstorm", "WebStorm", "webstorm", "WebStorm"},
	{"datagrip", "DataGrip", "datagrip", "DataGrip"},
	{"pycharm", "PyCharm", "pycharm", "PyCharm"},
	{"clion", "CLion", "clion", "CLion"},
	{"rustrover", "RustRover", "rustrover", "RustRover"},
	{"fleet", "Fleet", "", "Fleet"},
	{"nova", "Nova", "", "Nova"},
	{"coteditor", "CotEditor", "", "CotEditor"},
	{"bbedit", "BBEdit", "", "BBEdit"},
	{"textedit", "TextEdit", "", "TextEdit"},
}

func AvailableEditors() []apptypes.Editor {
	editors := []apptypes.Editor{{ID: "default", Name: "默认应用"}}
	for _, e := range knownEditors {
		if isEditorAvailable(e.cmd, e.macApp) {
			editors = append(editors, apptypes.Editor{ID: e.id, Name: e.name})
		}
	}
	return editors
}

func isEditorAvailable(cmd, macApp string) bool {
	if cmd != "" {
		if _, err := exec.LookPath(cmd); err == nil {
			return true
		}
	}
	if runtime.GOOS == "darwin" && macApp != "" {
		return isMacAppInstalled(macApp)
	}
	return false
}

func isMacAppInstalled(appName string) bool {
	homeDir, _ := os.UserHomeDir()
	for _, dir := range []string{"/Applications", filepath.Join(homeDir, "Applications"), "/System/Applications"} {
		if _, err := os.Stat(filepath.Join(dir, appName+".app")); err == nil {
			return true
		}
	}
	return false
}

func OpenConfigFile(target string, editorID string) error {
	var paths []string
	switch target {
	case "claude":
		paths = []string{configfile.ClaudeSettingsPath()}
	case "codex":
		paths = []string{
			configfile.CodexConfigPath(),
			configfile.CodexAuthPath(),
		}
	default:
		return fmt.Errorf("未知目标: %s", target)
	}
	for _, p := range paths {
		if _, err := os.Stat(p); os.IsNotExist(err) {
			continue
		}
		if err := openFileWith(p, editorID); err != nil {
			return err
		}
	}
	return nil
}

func openWithDefault(path string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", path).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", path).Start()
	default:
		return exec.Command("xdg-open", path).Start()
	}
}

func openFileWith(path, editorID string) error {
	if editorID == "" || editorID == "default" {
		return openWithDefault(path)
	}
	for _, e := range knownEditors {
		if e.id == editorID {
			if e.cmd != "" {
				if _, err := exec.LookPath(e.cmd); err == nil {
					return exec.Command(e.cmd, path).Start()
				}
			}
			if runtime.GOOS == "darwin" && e.macApp != "" {
				return exec.Command("open", "-a", e.macApp, path).Start()
			}
		}
	}
	return openWithDefault(path)
}
