
     
     
     <?php  // Use the <?php command so the server realizes this is PHP code and not HTML
     
     // Set the variable $q equal to whatever follows the "?query=" in the URL
     $q = $_GET["query"];   

     
     if (!$q){  // If the "query" line is blank, display the search page

         // The following echo commands generate standard HTML output for the browser to view.
         echo "<HTML>";
         echo "<TITLE> ORF 401: Assignment #1 - PHP - Spring 2011 </TITLE>"; 
         echo "<BODY>";
         echo "Enter a single word to search for: <br>";
         
         // Notice the creation of a form in HTML.  
         
         // <form action= ""> tells says which page to send the results of the form to.
         // <input type="text"> denotes a text input, the name="query" part 
         echo '<form action="isindexSearch.php" method="get">';
         echo '<input type="text" name="query" />';
         echo '<input type="submit" />';
         echo '</form>';      // End the Form
         
         // Closing HTML
         echo "</BODY>";
         echo "</HTML>";
         
     } else { // In this case, else means that there was some kind of data passed to the PHP script in the URL
  
     
        echo "<HTML>";
        echo "<TITLE> ORF 401: Assignment #1 - PHP - Search Results for " . $q . " </TITLE>"; 
        echo "<BODY>";
        echo "Searching for " . $q . "! <br>";

        echo "<br> DEBUG: Attempting to Execute the command <br>";
        
        // This is the java program we want to run and the parameters we want to pass to it.
        // You could also use:  
        // $string = "ls"
        // or something as a test.
         
        $string = "/usr/java/bin/java -Dformat=html RentalsSearchServer dvd.dat " . $q;
             
        echo $string . '<br><br>';

        // Tell the server to run the command, which launches Java, and store the results in the variable $output
        $output = shell_exec($string);
               
        echo "Output: <br><br" . $output;       
     	  echo "</BODY>";
        echo "</HTML>";
     }

   
     
      