app.js: src/app.ts src/typings
	tsc --out app.js src/app.ts

src/typings: src/dtsm.json
	cd src && dtsm install
