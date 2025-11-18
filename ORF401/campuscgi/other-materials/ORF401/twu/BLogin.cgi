#!/bin/sh
CLASSPATH=/usr/java/lib:.
export CLASSPATH
echo "Content-Type: text/html"
echo ""
/usr/java/bin/java B_Server "$QUERY_STRING"

