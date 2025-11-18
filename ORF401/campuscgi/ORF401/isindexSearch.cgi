#!/bin/sh
CLASSPATH=/usr/java/lib:.
export CLASSPATH

echo "Content-type: text/html"
echo ""

echo "<html>"
echo "<body>"
echo "<img src="logo.gif">"
echo "<hr />"

echo "<p>"
echo "Welcom to The Great DVD"
echo "for air traveler!"
echo "<br />"
echo "You can pick-up"
echo "a DVD movie at your origin airport, "
echo "watch it while you fly,"
echo "and drop" 
echo "it off at your destination airport."
echo "<p>"
echo "You can search our DVD movie database for your movie."
echo "<br />"
echo "Please enter a word below and press <B>Enter</B> on your keyboard."
echo "<p>"

if [ $# = 0 ]
then
echo "<ISINDEX PROMPT=\"Enter a single key word to search for:  \"> " 
else
echo "<ISINDEX PROMPT=\"Enter a single key word to search for:  \"> " 
/usr/java/bin/java -Dformat=html RentalsSearchServer dvd.dat "$QUERY_STRING"
fi
echo "</BODY>"
echo "</HTML>"


