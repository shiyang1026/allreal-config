package envscan

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestScanUnixShellFiles(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix-specific layout")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)

	zshrc := filepath.Join(home, ".zshrc")
	content := "" +
		"# header\n" +
		"export ANTHROPIC_API_KEY=sk-xxx\n" +
		"# export ANTHROPIC_AUTH_TOKEN=ignored\n" +
		"  OPENAI_BASE_URL=\"https://x\"\n" +
		"MY_OTHER_VAR=1\n" +
		"declare -x ANTHROPIC_BASE_URL=https://example.com\n"
	if err := os.WriteFile(zshrc, []byte(content), 0600); err != nil {
		t.Fatalf("write zshrc: %v", err)
	}

	conflicts := Scan()
	if len(conflicts) != 1 {
		t.Fatalf("len(conflicts) = %d, want 1", len(conflicts))
	}
	c := conflicts[0]
	if c.FileID != "shell-zshrc" {
		t.Fatalf("file_id = %q, want shell-zshrc", c.FileID)
	}
	if c.Path != zshrc {
		t.Fatalf("path = %q, want %q", c.Path, zshrc)
	}
	if len(c.Matches) != 3 {
		t.Fatalf("len(matches) = %d, want 3 (matches=%v)", len(c.Matches), c.Matches)
	}

	got := map[int]string{}
	for _, m := range c.Matches {
		got[m.Line] = m.Variable
	}
	if got[2] != "ANTHROPIC_API_KEY" {
		t.Errorf("line 2 = %q, want ANTHROPIC_API_KEY", got[2])
	}
	if got[4] != "OPENAI_BASE_URL" {
		t.Errorf("line 4 = %q, want OPENAI_BASE_URL", got[4])
	}
	if got[6] != "ANTHROPIC_BASE_URL" {
		t.Errorf("line 6 = %q, want ANTHROPIC_BASE_URL", got[6])
	}
}

func TestScanNoMatches(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)

	conflicts := Scan()
	if len(conflicts) != 0 {
		t.Fatalf("len(conflicts) = %d on empty home, want 0", len(conflicts))
	}
}

func TestScanIgnoresUnrelatedPrefixes(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("unix-specific layout")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)

	bashrc := filepath.Join(home, ".bashrc")
	content := "" +
		"export MYANTHROPIC_API_KEY=fake\n" +
		"export OPENAI_THIS_IS_FINE=ok\n" +
		"export PROXY_OPENAI_KEY=nope\n"
	if err := os.WriteFile(bashrc, []byte(content), 0600); err != nil {
		t.Fatalf("write bashrc: %v", err)
	}

	conflicts := Scan()
	if len(conflicts) != 1 {
		t.Fatalf("len(conflicts) = %d, want 1 (only OPENAI_THIS_IS_FINE)", len(conflicts))
	}
	if len(conflicts[0].Matches) != 1 || conflicts[0].Matches[0].Variable != "OPENAI_THIS_IS_FINE" {
		t.Fatalf("matches = %v, want only OPENAI_THIS_IS_FINE", conflicts[0].Matches)
	}
}

func TestMatchLinePowerShell(t *testing.T) {
	cases := []struct {
		line, want string
	}{
		{`$env:ANTHROPIC_API_KEY = "x"`, "ANTHROPIC_API_KEY"},
		{`  $env:OPENAI_BASE_URL="https://x"`, "OPENAI_BASE_URL"},
		{`# $env:ANTHROPIC_API_KEY = "x"`, ""},
		{`[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "x", "User")`, "ANTHROPIC_API_KEY"},
		{`Write-Host "hi"`, ""},
	}
	for _, c := range cases {
		trimmed := c.line
		if len(trimmed) > 0 && trimmed[0] == '#' {
			if matchLine(LanguagePowerShell, c.line) != "" {
				t.Errorf("comment matched: %q", c.line)
			}
			continue
		}
		got := matchLine(LanguagePowerShell, c.line)
		if got != c.want {
			t.Errorf("matchLine(%q) = %q, want %q", c.line, got, c.want)
		}
	}
}
