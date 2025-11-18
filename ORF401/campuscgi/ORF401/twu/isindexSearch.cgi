#!/bin/sh
CLASSPATH=/usr/java/lib:.
export CLASSPATH

echo "Content-type: text/html"
echo ""

echo "<HTML>"
echo "<BODY>"
echo "<IMG SRC="logo.gif">"
echo "<HR>"

echo "<P>"
echo "Welcom to <B><I><FONT COLOR=BLUE>The Great DVD</FONT></I></B>" 
echo "for air traveler!"
echo "<BR>"
echo "You can <FONT COLOR=RED>pick-up</FONT>"
echo "a DVD movie at your origin airport, "
echo "<FONT COLOR=RED>watch</FONT> it while you fly,"
echo "and <FONT COLOR=RED>drop</FONT>" 
echo "it off at your destination airport."
echo "<P>"
echo "You can search our DVD movie database for your movie."
echo "<BR>"
echo "Please enter a word below and press <B>Enter</B> on your keyboard."
echo "<P>"

if [ $# = 0 ]
then
echo "<ISINDEX PROMPT=\"Enter a single key word to search for:  \"> " 
else
echo "<ISINDEX PROMPT=\"Enter a single key word to search for:  \"> " 
/usr/java/bin/java -Dformat=html RentalsSearchServer dvd.dat "$QUERY_STRING"
fi
echo "</BODY>"
echo "</HTML>"


