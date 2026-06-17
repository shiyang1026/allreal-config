//go:build ignore

package main

import (
	"image/png"
	"os"

	"github.com/jackmordaunt/icns"
)

func main() {
	if len(os.Args) != 3 {
		panic("usage: go run scripts/make-icns.go input.png output.icns")
	}

	in, err := os.Open(os.Args[1])
	if err != nil {
		panic(err)
	}
	defer in.Close()

	img, err := png.Decode(in)
	if err != nil {
		panic(err)
	}

	out, err := os.Create(os.Args[2])
	if err != nil {
		panic(err)
	}
	defer out.Close()

	if err := icns.Encode(out, img); err != nil {
		panic(err)
	}
}
