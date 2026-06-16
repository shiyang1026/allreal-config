package main

import (
	"embed"
	"os"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	launch := parseLaunchContext()
	app := NewAppWithLaunchContext(launch)

	err := wails.Run(makeAppOptions(app, launch))
	if err != nil {
		println("Error:", err.Error())
	}
}

func parseLaunchContext() LaunchContext {
	for _, arg := range os.Args[1:] {
		if strings.HasPrefix(arg, "--config-editor=") {
			return LaunchContext{
				Mode:          "config-editor",
				InitialFileID: strings.TrimPrefix(arg, "--config-editor="),
			}
		}
	}
	return LaunchContext{}
}

func makeAppOptions(app *App, launch LaunchContext) *options.App {
	width := 480
	height := 640
	minWidth := 460
	minHeight := 620
	title := "AllReal Config"

	if launch.Mode == "config-editor" {
		width = 980
		height = 760
		minWidth = 780
		minHeight = 560
		title = "编辑配置文件"
	}
	macTitleBar := &mac.TitleBar{
		TitlebarAppearsTransparent: true,
		HideTitle:                  true,
		FullSizeContent:            true,
	}

	return &options.App{
		Title:            title,
		Width:            width,
		Height:           height,
		MinWidth:         minWidth,
		MinHeight:        minHeight,
		DisableResize:    false,
		BackgroundColour: &options.RGBA{R: 15, G: 23, B: 42, A: 1},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			TitleBar:             macTitleBar,
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			About: &mac.AboutInfo{
				Title:   "AllReal Config",
				Message: "AI 编程工具一键配置助手",
			},
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	}
}
