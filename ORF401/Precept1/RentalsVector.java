import java.util.*;
import java.io.*;


/**
 *  A group of DVD movie rental records.  This class has many of the
 *  same behaviors as java.util.Vector (For use in Orf401.)
 *
 *  @see     RentalsRecord
 *  @version 1.1  01 February 2005
 *  @author  David Bernstein & Alain Kornhauser
 *
 *  Copyright, Princeton University
 */
public class RentalsVector
{
     private Vector rentals;



     /**
      * Construct a new RentalsVector
      *
      */
     public RentalsVector()
     {
          rentals = new Vector();
     }





     /**
      * Add an element to (the end of) this RentalsVector
      *
      * @param r   The RentalsRecord to add
      */
     public void addElement(RentalsRecord r)
     {
          rentals.addElement(r);
     }




     /**
      * Get the element at a particular index
      *
      * @param i     The index
      * @return      The requested RentalsRecord
      */
     public RentalsRecord elementAt(int i)
     {
          if (i > rentals.size()-1) {

               return null;

          }

          return (RentalsRecord)(rentals.elementAt(i));
     }





     /**
      * Parse a given DataInputStream and populate this
      * RentalsVector
      *
      * @param dis     The DataInputStream containing the RentalsRecord info
      */
     public void populate(DataInputStream dis)
     {
          String              in;
          StringTokenizer     st;
          RentalsRecord       rr;


          try {
               while ( ((in=dis.readLine()) != null) &&
                        (!in.equals(""))                   ){

                    st = new StringTokenizer(in,"\t");

                    rr = new RentalsRecord();

                    rr.setTitle(st.nextToken());
                    rr.setCode(st.nextToken());
                    rr.setAvailable( (Integer.valueOf(st.nextToken().trim()))
                                   .intValue() );

                    addElement(rr);
               }

          } catch (IOException ioe) {

               System.out.println("IOException: "+ioe);
               ioe.printStackTrace();
          }


     }



     /**
      * Get the number of elements in this RentalsVector
      *
      * @return      The number of elements
      */
     public int size()
     {

          return rentals.size();
     }
}
