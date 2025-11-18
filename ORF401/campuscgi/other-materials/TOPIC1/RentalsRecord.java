/**
 *  Information about a DVD movie rental.  Contains the title
 *  of the movie, the item code, and the number of copies
 *  that are currently available to be rented. (For use in Orf 401.)
 *
 *  @version 1.1  01 February 2005
 *  @author  David Bernstein Alain Kornhauser
 *
 *  Copyright, Princeton University
 */
public class RentalsRecord
{
     String title;
     String code;
     int    available;





     /**
      * Decrease the number of available (i.e., un-rented) copies of this DVD
      *
      */
     public void decreaseAvailable()
     {
          available--;
     }



     /**
      * Get the number of available (i.e., un-rented) copies of this DVD
      *
      * @return  The number of available DVDs
      */
     public int getAvailable()
     {
          return available;
     }



     /**
      * Get the item code for this DVD
      *
      * @return  The item code
      */
     public String getCode()
     {
          return code;
     }



     /**
      * Get the title of this DVD
      *
      * @return  The title of this DVD
      */
     public String getTitle()
     {
          return title;
     }





     /**
      * Increase the number of available (i.e., un-rented) copies of this DVD
      *
      */
     public void increaseAvailable()
     {
          available++;
     }





     /**
      * Set the number of available (i.e., un-rented) copies of this DVD
      *
      * @param available  The number of available DVDs
      */
     public void setAvailable(int available)
     {
          this.available = available;
     }



     /**
      * Set the item code for this DVD
      *
      * @param code  The item code
      */
     public void setCode(String code)
     {
          this.code = code;
     }



     /**
      * Set the title of this DVD
      *
      * @param title  The title of this DVD
      */
     public void setTitle(String title)
     {
          this.title = title;
     }



     /**
      * Convert all of the information about this DVD to a string
      *
      * @return The string representation of this DVD
      */
     public String toString()
     {
          return title+"\t"+code+"\t"+available;
     }




}
