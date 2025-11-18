import java.io.*;
import java.net.*;
import java.util.*;


/**
 * CIV401 - Electronic Commerce
 *
 * A simple UDP socket example
 * (Writes vending machine transactions to a UDP socket)
 */
public class vmReporter
{


    public static void main(String[] args)
    {
        byte[]                data;
        DatagramPacket        dp;
        DatagramSocket        ds;
        InetAddress           ipAddress;
        int                   delay, port, product, transaction;
        Random                r;
        String                msg;
        String[]              text;





        text = new String[2];
        text[0] = "Sale";
        text[1] = "Sold Out";



        try {

            ds = new DatagramSocket();

            ipAddress = InetAddress.getByName(args[0]);
            port      = Integer.valueOf(args[1]).intValue();

            System.out.println("Reporting to "+args[0]+" on port "+port+"\n");

            while ( true ){

                r = new Random();

                try {

                    // Sleep between 5 and 15 seconds
                    delay = Math.abs(r.nextInt())%15001+5000;
                    Thread.sleep(delay);

                    // Generate a random product between 1 and 50
                    product = Math.abs(r.nextInt())%51+1;

                    // Generate a random transaction between 0 and 1
                    transaction = Math.abs(r.nextInt())%2+0;

                    msg = "Soda Machine 327"+"\t"+product+"\t"+text[transaction];
                    data = new byte[msg.length()];
                    msg.getBytes(0,msg.length(),data,0);

                    dp = new DatagramPacket(data,data.length,ipAddress,port);

                    ds.send(dp);

                } catch (InterruptedException ie) {

                    // Do nothing

                } catch (IOException ioe) {

                    // Do nothing
                }

            }

        } catch (UnknownHostException uhe) {

            System.err.println("Unknown host: "+uhe);
            System.exit(1);

        } catch (IOException ioes) {

            System.err.println("Unable to open socket: "+ioes);
            System.exit(1);

        }
    }



}
