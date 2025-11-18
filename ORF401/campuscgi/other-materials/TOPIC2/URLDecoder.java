/**
 * The class contains a utility method for converting a String from 
 * a MIME format called <CODE>x-www-form-urlencoded</CODE> format.  Conversions
 * in the other direction can be accomplished using java.net.URLEncoder
 *
 *
 * To convert a String, each character is examined in turn: 
 * <UL>
 * <LI> The ASCII characters 'a' through 'z', 'A' through 'Z', and '0' 
        through '9' remain the same. 
 * <LI> The space character ' ' is converted from a plus sign '+'. 
 * <LI> All other characters are converted from the 3-character 
 *      string "%xy", where xy is the two-digit hexadecimal representation 
 *      of the lower 8-bits of the character. 
 * </UL>
 *
 *  @version 1.0  01 February 1999
 *  @author  David Bernstein
 *
 *  Copyright, Princeton University
 */
public class URLDecoder
{

     /**
      * Translate a string from <CODE>x-www-form-urlencoded</CODE> format.
      * 
      * @param s   The String to decode
      * @return    The Decoded String
      */
     public static String decode(String s)
     {
          int          i;
          char         current, decoded;
          String       retval, special;
          StringBuffer result;


          i = 0;
          result = new StringBuffer();

          while (i < s.length()) {
 
               current = s.charAt(i);

               switch(current)
               {
                    case '+':

                         result.append(" ");
                         i++;
                         break;

                    case '%':

                         special = s.substring(i+1,i+3);
                         decoded = (char)(Integer.parseInt(special,16));
                         result.append(String.valueOf(decoded));
                         i = i + 3;
                         break;

                    default:

                         result.append(String.valueOf(current));
                         i++;
                         break;
               }
          }

          retval = result.toString();
          return retval;
     }
}
