package envscan

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"allreal-config/internal/apptypes"
)

type ShellFileSpec struct {
	ID       string
	Label    string
	Path     string
	Language string
}

const (
	LanguageShell      = "shell"
	LanguagePowerShell = "powershell"
)

var (
	shellAssignRe = regexp.MustCompile(`^\s*(?:export\s+|set\s+(?:-x\s+)?|declare\s+-x\s+|typeset\s+-x\s+)?(ANTHROPIC_[A-Z0-9_]+|OPENAI_[A-Z0-9_]+)\s*=`)
	pwshEnvRe     = regexp.MustCompile(`^\s*\$env:(ANTHROPIC_[A-Z0-9_]+|OPENAI_[A-Z0-9_]+)\s*=`)
	pwshSetEnvRe  = regexp.MustCompile(`\[Environment\]::SetEnvironmentVariable\s*\(\s*['"](ANTHROPIC_[A-Z0-9_]+|OPENAI_[A-Z0-9_]+)['"]`)
)

func ShellFiles() []ShellFileSpec {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return nil
	}

	if runtime.GOOS == "windows" {
		return []ShellFileSpec{
			{
				ID:       "shell-pwsh7",
				Label:    "PowerShell 7 Profile",
				Path:     filepath.Join(home, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1"),
				Language: LanguagePowerShell,
			},
			{
				ID:       "shell-pwsh5",
				Label:    "Windows PowerShell Profile",
				Path:     filepath.Join(home, "Documents", "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"),
				Language: LanguagePowerShell,
			},
		}
	}

	return []ShellFileSpec{
		{ID: "shell-zshrc", Label: "~/.zshrc", Path: filepath.Join(home, ".zshrc"), Language: LanguageShell},
		{ID: "shell-zshenv", Label: "~/.zshenv", Path: filepath.Join(home, ".zshenv"), Language: LanguageShell},
		{ID: "shell-zprofile", Label: "~/.zprofile", Path: filepath.Join(home, ".zprofile"), Language: LanguageShell},
		{ID: "shell-bashrc", Label: "~/.bashrc", Path: filepath.Join(home, ".bashrc"), Language: LanguageShell},
		{ID: "shell-bash-profile", Label: "~/.bash_profile", Path: filepath.Join(home, ".bash_profile"), Language: LanguageShell},
		{ID: "shell-profile", Label: "~/.profile", Path: filepath.Join(home, ".profile"), Language: LanguageShell},
	}
}

func Scan() []apptypes.ShellConflict {
	files := ShellFiles()
	out := make([]apptypes.ShellConflict, 0)
	for _, spec := range files {
		matches := scanFile(spec)
		if len(matches) == 0 {
			continue
		}
		out = append(out, apptypes.ShellConflict{
			FileID:  spec.ID,
			Label:   spec.Label,
			Path:    spec.Path,
			Matches: matches,
		})
	}
	return out
}

func scanFile(spec ShellFileSpec) []apptypes.ShellMatch {
	f, err := os.Open(spec.Path)
	if err != nil {
		return nil
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)

	var matches []apptypes.ShellMatch
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := scanner.Text()
		if isCommentLine(line) {
			continue
		}
		if v := matchLine(spec.Language, line); v != "" {
			matches = append(matches, apptypes.ShellMatch{Variable: v, Line: lineNo})
		}
	}
	return matches
}

func isCommentLine(line string) bool {
	trimmed := strings.TrimLeft(line, " \t")
	return strings.HasPrefix(trimmed, "#")
}

func matchLine(language, line string) string {
	if language == LanguagePowerShell {
		if m := pwshEnvRe.FindStringSubmatch(line); m != nil {
			return m[1]
		}
		if m := pwshSetEnvRe.FindStringSubmatch(line); m != nil {
			return m[1]
		}
		return ""
	}
	if m := shellAssignRe.FindStringSubmatch(line); m != nil {
		return m[1]
	}
	return ""
}
