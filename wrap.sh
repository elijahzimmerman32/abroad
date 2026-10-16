#!/bin/sh
# Wrap the page content in a full HTML document so it runs on its own.
{ printf '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#15181C"><meta name="apple-mobile-web-app-capable" content="yes"></head><body>\n'; cat "$1"; printf '\n</body></html>\n'; } > "$2"
