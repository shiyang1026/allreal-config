package configfile

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type Profile string

const (
	ProfileProduction Profile = "prod"
	ProfileDev        Profile = "dev"
)

type Paths struct {
	Profile        Profile
	ClaudeSettings string
	CodexConfig    string
	CodexAuth      string
}

func UserConfigDir() string {
	if runtime.GOOS == "windows" {
		return os.Getenv("APPDATA")
	}
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".config")
}

func ActiveProfile() Profile {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("ALLREAL_CONFIG_PROFILE"))) {
	case "dev", "development":
		return ProfileDev
	default:
		return ProfileProduction
	}
}

func ActivePaths() Paths {
	return PathsForProfile(ActiveProfile())
}

func PathsForProfile(profile Profile) Paths {
	homeDir, _ := os.UserHomeDir()
	switch profile {
	case ProfileDev:
		return Paths{
			Profile:        ProfileDev,
			ClaudeSettings: filepath.Join(homeDir, ".claude", "settings-dev.json"),
			CodexConfig:    filepath.Join(homeDir, ".codex", "config-dev.toml"),
			CodexAuth:      filepath.Join(homeDir, ".codex", "auth-dev.json"),
		}
	default:
		return Paths{
			Profile:        ProfileProduction,
			ClaudeSettings: filepath.Join(homeDir, ".claude", "settings.json"),
			CodexConfig:    filepath.Join(homeDir, ".codex", "config.toml"),
			CodexAuth:      filepath.Join(homeDir, ".codex", "auth.json"),
		}
	}
}

func backupFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	backupPath := fmt.Sprintf("%s.bak.%s", path, time.Now().Format("20060102150405"))
	return os.WriteFile(backupPath, data, 0600)
}
