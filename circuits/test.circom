template normalize(w, nb) {
    signal input a[nb];
    signal input modulus[nb];

    signal output out[nb];

    // check a greater than modulus
    var needSub = 2;
    for (var i = nb - 1; i >= 0; i--) {
        if(a[i] > modulus[i] && needSub == 2) {
            needSub = 1;
        }

        if (a[i] < modulus[i] && needSub == 2) {
            needSub = 0;
        }
    }

    var borrow = 0;
    var temp = 0;

    var t[nb];

    if (needSub == 0) {
        // out = a
        for (var i = 0;i < nb; i++) {
            out[i] <== a[i];
        }
    } else {
         // out =  a - m;

        for (var i = 0; i< nb; i++) {
            temp = a[i];

            if(borrow == 1) {
                temp--;
            }

            if (((temp == 0) && (modulus[i] > 0 || borrow == 1)) || temp < modulus[i]) {
                borrow = 1;
                temp += 1 << (w + 1);
            } else {
                borrow = 0;
            }

            t[i]  = (temp - modulus[i]) & 18446744073709551615;
        }

        var last = nb - 1;
        var sign = 0;

        for (var i = nb - 1; i >= 0; i--) {
            if (t[i] != 0 || sign != 0) {
                t[last] = t[i];
                last --;
                if (last != i) {
                    t[i] = 0;
                }

                sign = 1;
            }
        }

        for (var i = 0; i< nb; i++) {
            out[i] <== t[i];
        }
   }
}

component main = normalize(64, 256);
