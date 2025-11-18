import java.io.*;
import java.util.*;




/**
 *  A database of DVD rental records. (For use in Orf401.)
 *
 *  @see     RentalsRecord
 *  @version 1.1  01 February 2004
 *  @author  David Bernstein Alain Kornhauser
 *
 *  Copyright, Princeton University
 */
public class RentalsDatabase
{

     private RentalsVector   r;



     /**
      * Construct a new RentalsDatabase
      */
     public RentalsDatabase()
     {
          r = new RentalsVector();
     }






     /**
      * Read the database from a tab-delimited file
      *
      * @param fn   The name of the file
      */
     public void readDatabase(String fn)
     {
          DataInputStream  dis;


          try {

               dis = new DataInputStream(new BufferedInputStream(new FileInputStream(fn)));

               r.populate(dis);

          } catch(IOException ioe) {

               System.out.println("Error: "+ioe);
               ioe.printStackTrace();
               System.exit(1);
          }
     }







     /**
      * Reserve a particular DVD (based on title or code) and
      * return the reserved record.
      * This search is not case sensitive.
      *
      * @param text   The text to search for
      * @return       The RentalsRecord that was reserved
      */
     public RentalsRecord Reserve(String text)
     {
          int             i, found;

          String          code, key, title;

          RentalsRecord   rr;



          key = text.toUpperCase().trim();

          for (i=0; i<=r.size()-1; i++) {

               rr = r.elementAt(i);
               title = (rr.getTitle()).toUpperCase().trim();
               code  = (rr.getCode()).toUpperCase().trim();

               if (title.equals(key) || code.equals(key)) {

                    if (rr.available >= 1) {

                         rr.decreaseAvailable();

                         return rr;   // break out of for loop
                    }
               }
          }

          return null;
     }




     /**
      * Search the database for all titles containing a piece of text.
      * This search is not case sensitive.
      *
      * @param text   The text to search for
      * @return       The RentalsVector of appropriate records
      */
     public RentalsVector Search(String text)
     {
          int             i;

          String          key;
          String          title;

          RentalsRecord   rr;
          RentalsVector   hits;



          key = text.toUpperCase().trim();
          hits = new RentalsVector();

          for (i=0; i<=size()-1; i++) {

               rr = r.elementAt(i);
               title = (rr.getTitle()).toUpperCase().trim();
               if (title.indexOf(key) >= 0) {

                    hits.addElement(rr);
               }
          }

          return hits;
     }



     /**
      * Get the size of the database
      *
      * @return       The number of records in the database
      */
     public int size()
     {

          return r.size();
     }


}
