//go:build ignore

package main

import (
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"os"
)

func main() {
	if len(os.Args) != 2 {
		panic("usage: go run scripts/make-dmg-background.go output.png")
	}

	const w, h = 760, 420
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		t := uint8(y * 18 / h)
		draw.Draw(img, image.Rect(0, y, w, y+1), &image.Uniform{color.RGBA{R: 246 - t, G: 248 - t, B: 252, A: 255}}, image.Point{}, draw.Src)
	}

	drawArrow(img, 322, 206, 438, 206)

	out, err := os.Create(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer out.Close()
	if err := png.Encode(out, img); err != nil {
		panic(err)
	}
}

func drawArrow(img *image.RGBA, x1, y1, x2, y2 int) {
	c := color.RGBA{55, 112, 231, 255}
	for y := -2; y <= 2; y++ {
		draw.Draw(img, image.Rect(x1, y1+y, x2, y1+y+1), &image.Uniform{c}, image.Point{}, draw.Src)
	}
	for i := 0; i < 18; i++ {
		draw.Draw(img, image.Rect(x2-i, y2-i/2-2, x2-i+1, y2-i/2+3), &image.Uniform{c}, image.Point{}, draw.Src)
		draw.Draw(img, image.Rect(x2-i, y2+i/2-2, x2-i+1, y2+i/2+3), &image.Uniform{c}, image.Point{}, draw.Src)
	}
}
