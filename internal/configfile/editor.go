package configfile

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"allreal-config/internal/apptypes"

	"github.com/BurntSushi/toml"
)

type editableFile struct {
	id       string
	label    string
	path     string
	language string
}

func ListEditableFiles() []apptypes.ConfigFileInfo {
	files := editableFiles()
	infos := make([]apptypes.ConfigFileInfo, 0, len(files))
	for _, file := range files {
		_, err := os.Stat(file.path)
		infos = append(infos, apptypes.ConfigFileInfo{
			ID:       file.id,
			Label:    file.label,
			Path:     file.path,
			Language: file.language,
			Exists:   err == nil,
		})
	}
	return infos
}

func ReadEditableFile(id string) (*apptypes.ConfigFileContent, error) {
	file, err := findEditableFile(id)
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(file.path)
	if err != nil {
		if os.IsNotExist(err) {
			data = []byte{}
		} else {
			return nil, fmt.Errorf("读取配置文件失败: %w", err)
		}
	}

	return &apptypes.ConfigFileContent{
		ID:       file.id,
		Label:    file.label,
		Path:     file.path,
		Language: file.language,
		Content:  string(data),
	}, nil
}

func SaveEditableFile(id string, content string) (*apptypes.Result, error) {
	file, err := findEditableFile(id)
	if err != nil {
		return nil, err
	}
	if result := validateEditableContent(file, content); result != nil {
		return result, nil
	}

	if err := os.MkdirAll(filepath.Dir(file.path), 0700); err != nil {
		return &apptypes.Result{Success: false, Message: "创建目录失败: " + err.Error()}, nil
	}
	if err := backupFile(file.path); err != nil && !os.IsNotExist(err) {
		return &apptypes.Result{Success: false, Message: "备份失败: " + err.Error()}, nil
	}
	if err := os.WriteFile(file.path, []byte(content), 0600); err != nil {
		return &apptypes.Result{Success: false, Message: "写入失败: " + err.Error()}, nil
	}

	return &apptypes.Result{Success: true, Message: "配置文件已保存"}, nil
}

func editableFiles() []editableFile {
	paths := ActivePaths()
	return []editableFile{
		{id: "claude", label: "Claude Code", path: paths.ClaudeSettings, language: "json"},
		{id: "codex-config", label: "Codex 配置", path: paths.CodexConfig, language: "toml"},
		{id: "codex-auth", label: "Codex 认证", path: paths.CodexAuth, language: "json"},
	}
}

func findEditableFile(id string) (editableFile, error) {
	for _, file := range editableFiles() {
		if file.id == id {
			return file, nil
		}
	}
	return editableFile{}, fmt.Errorf("未知配置文件: %s", id)
}

func validateEditableContent(file editableFile, content string) *apptypes.Result {
	switch file.language {
	case "json":
		if len(content) > 0 && !json.Valid([]byte(content)) {
			return &apptypes.Result{Success: false, Message: "JSON 格式不正确，请检查后再保存"}
		}
	case "toml":
		var decoded map[string]interface{}
		if _, err := toml.Decode(content, &decoded); err != nil {
			return &apptypes.Result{Success: false, Message: "TOML 格式不正确: " + err.Error()}
		}
	}
	return nil
}
