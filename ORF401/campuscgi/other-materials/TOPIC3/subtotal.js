/**
 * ORF401 - Electronic Commerce - Supporting Script for Part IV of the
 *                                Server Side Processing Example
 */
function subtotal(product)
{
    var grandtotal, i, n, q, total;

    q = document.orderform["q"+product].value;
    total = price[product] * q;
    document.orderform["t"+product].value = total;


    grandtotal = 0;
    document.orderform["total"].value = 0;

    for (n in price) {

         grandtotal += (1*document.orderform["t"+n].value);
    }

    document.orderform["total"].value = grandtotal;
}
