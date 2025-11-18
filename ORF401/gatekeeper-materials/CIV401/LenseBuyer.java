import java.io.*;
import java.net.*;

/**
 * CIV401 - Electronic Commerce
 *
 * The Client for A Simple TCP Socket Example
 */
public class LenseBuyer
{


    public static void main(String[] args)
    {
        String product;


        product = args[0];
        checkPrice("civ-101098a.princeton.edu", 8189, product);
    }



    public static void checkPrice(String host, int port, String product)
    {
        DataInputStream   in;
        PrintStream       out;
        Socket            s;
        String            reply;


        try {

            s = new Socket(host, port);

            try {

                out = new PrintStream(s.getOutputStream(), true);
                in  = new DataInputStream(s.getInputStream());

                out.println("SEARCH"+"\t"+product);
                reply = in.readLine();

                if (reply.indexOf("NOT FOUND") < 0) {

                    System.out.println(reply);
                }

                out.close();
                in.close();

            } catch (IOException ioef) {

                // Problem with the I/O so close the Socket
                try {s.close();} catch (IOException ioe) { };
            }

        } catch (IOException ioes) {

            // Couldn't open the Socket
        }
    }


}
