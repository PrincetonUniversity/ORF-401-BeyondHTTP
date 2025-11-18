#!/bin/sh
CLASSPATH=/usr/java/lib:.
export CLASSPATH
echo "Content-Type: text/html"
echo ""
/usr/java/bin/java  FinancialDataServer "$QUERY_STRING"