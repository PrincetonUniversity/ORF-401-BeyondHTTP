import java.io.*;
import java.util.*;
import java.net.*;
import java.awt.*;
import java.awt.event.*;

public class GateListener extends Thread {

  public GateInformationBoard board; //check to make sure where this is used
  public int port;
  
  public DatagramSocket dsocket;
  public DatagramPacket in;
  
  public GateListener(int portUDP, GateInformationBoard gboard) {
    board = gboard;
    port = portUDP;
    
    try { 
       dsocket = new DatagramSocket(port); 
    } catch (IOException ioe) { 
        //do nothing 
    }
  }
  
  public void run()
  {
    int bufferLength = 255; 
    byte[] buffer= new byte[bufferLength];
    String line;
    Random random;
    
    while (true) {   
      random = new Random();
      //int delay;
      
      try { 
        //delay = Math.abs(random.nextInt())%15001+250; 
        Thread.sleep(100);
        
        in = new DatagramPacket(buffer, buffer.length); 
        
        dsocket.receive(in); 
        
        line = new String(in.getData(), 0, 0, in.getLength()); 
       
        if ( (line != null) && (!line.equals("")) ) { 
            //System.out.println(line);
            processMessage(line); 
         }
      }
      catch (IOException ioe) {
          System.err.println(""+ioe);
      } 
      catch (InterruptedException e) {
          e.printStackTrace();
      }
    }
  }
  
  public void processMessage(String msg) 
  { 
    String company, destination, seat, gate;
    StringTokenizer st;
    
    st = new StringTokenizer(msg,",");
    
    try {
      company = st.nextToken();
      destination = st.nextToken();
      st.nextToken();   // just gets rid of "SEAT", not a var
      seat = st.nextToken();
      st.nextToken();   // just gets rid of "GATE", not a var
      gate = st.nextToken();
      
      board.display(destination, seat, gate);
      
    } catch (NoSuchElementException nsee) {
        // Do nothing
    }
  } 
}
