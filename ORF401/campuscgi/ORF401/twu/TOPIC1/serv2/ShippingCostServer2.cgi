#!/bin/sh
CLASSPATH=/usr/java/lib:.
export CLASSPATH
echo "Content-type: text/html"
echo ""
if [ $# = 0 ]
then
echo "<HTML>"
echo "<BODY>"
echo "Tony's Replication:"
echo "<P>"
echo "Use this page to determine the shipping cost to any state."
echo "<P>"
echo "<ISINDEX PROMPT=\"Two character state code (e.g., NY):\" >"
else
/usr/java/bin/java ShippingCostServer2 "$QUERY_STRING"
fi
