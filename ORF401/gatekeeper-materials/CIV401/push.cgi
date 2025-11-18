#!/bin/sh
#echo "Content-type: multipart/mixed;boundary=nextpart"
#echo ""
#echo "--nextpart"
#while true
#    do
        echo "Content-type: text/html"
        echo ""
        echo "<HTML>"
        echo "<HEAD>"
        echo "<TITLE>Server-Push Example</TITLE>"
        echo "</HEAD>"
        echo "<BODY>"
        echo "<P>Time:</P>"
        echo "<CENTER>"
#        date
        echo "</CENTER>"
        echo "</BODY>"
        echo "</HTML>"
#        echo "--nextpart"
#        sleep 10
#    done