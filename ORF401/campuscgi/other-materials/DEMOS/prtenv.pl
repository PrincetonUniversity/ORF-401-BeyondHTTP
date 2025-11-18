#!/usr/princeton/bin/perl  
# 
# 
#print "Set-Cookie: cook=done; \n";
#print "Set-Cookie: cook=welldone; expires=expires=Wednesday, 8-Nov-95 23:12:40 GMT \n";
#print "Set-Cookie: cook=welldone; expires=expires=Wednesday, 8-Nov-95 23:12:40 GMT path=/ \n";
#print "Set-Cookie: rare=astheycome; expires=expires=Wednesday, 8-Nov-95 23:12:40 GMT \n";
#print &PrintHeader; 
print "Content-type: text/html\n\n";
# 
print "<html>\n"; 
print "<head> <title> Environment Variables </title> </head>\n"; 
print "<body>\n"; 
print "<HR><H2> CGI Environment:</H2>\n";
print <<EOF; 
<center> 
<table border=2 cellpadding=10 cellspacing=10>  
<th align=left><h3>Environment Variable</h3>  
<th align=left> <h3>Contents </h3><tr> 
EOF

#foreach $var (sort keys(%ENV)) 
#{  
#    print "<td> $var <td> $ENV{$var}<tr>"; 
#} 

@http_env = ();
foreach (keys %ENV) {
    push( @http_env, $_) if /^HTTP_/;
}
#@http_env = sort @http_env;

foreach $tag ('SERVER_SOFTWARE', 'SERVER_NAME', 'GATEWAY_INTERFACE', 
              'SERVER_PROTOCOL', 'SERVER_PORT', 'REQUEST_METHOD', 
              @http_env, 'PATH_INFO', 'PATH_TRANSLATED', 'SCRIPT_NAME',
              'QUERY_STRING', 'REMOTE_HOST', 'REMOTE_ADDR', 'REMOTE_USER',
              'CONTENT_TYPE', 'CONTENT_LENGTH') {
        $env{$tag} = $ENV{$tag};
}
foreach $var (sort keys(%env)) 
{  
    print "<td> $var <td> $env{$var}<tr>"; 
} 


print <<EOF; 
</table> 
</body> 
</html> 
EOF

