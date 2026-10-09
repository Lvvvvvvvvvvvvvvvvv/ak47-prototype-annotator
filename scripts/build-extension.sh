#!/bin/zsh
set -euo pipefail

root_dir="${0:A:h:h}"
source_file="$root_dir/index.html"
output_file="$root_dir/extension/content.js"

awk '
  /<script type="text\/plain" id="annotatorSource">/ { inside = 1; print "(function() {"; next }
  /<\/script>/ && inside { print "})();"; exit }
  inside { print }
' "$source_file" > "$output_file"

cp "$root_dir/assets/kun.png" "$root_dir/extension/icons/kun.png"
printf 'Built %s\n' "$output_file"
