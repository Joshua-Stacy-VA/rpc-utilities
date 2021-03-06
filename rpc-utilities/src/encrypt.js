'use strict';

const isString = require('lodash.isstring');
const random = require('lodash.random');

/**
 * @module Encryption
 */

/*
 * Change by VDP 5/2016 - need to support both the VA and OSEHRA Cyphers. OSEHRA VISTA uses a
 * different Cipher.
 */
const CIPHER_PAD_VA = [
    'wkEo-ZJt!dG)49K{nX1BS$vH<&:Myf*>Ae0jQW=;|#PsO`\'%+rmb[gpqN,l6/hFC@DcUa ]z~R}"V\\iIxu?872.(TYL5_3',
    'rKv`R;M/9BqAF%&tSs#Vh)dO1DZP> *fX\'u[.4lY=-mg_ci802N7LTG<]!CWo:3?{+,5Q}(@jaExn$~p\\IyHwzU"|k6Jeb',
    '\\pV(ZJk"WQmCn!Y,y@1d+~8s?[lNMxgHEt=uw|X:qSLjAI*}6zoF{T3#;ca)/h5%`P4$r]G\'9e2if_>UDKb7<v0&- RBO.',
    'depjt3g4W)qD0V~NJar\\B "?OYhcu[<Ms%Z`RIL_6:]AX-zG.#}$@vk7/5x&*m;(yb2Fn+l\'PwUof1K{9,|EQi>H=CT8S!',
    'NZW:1}K$byP;jk)7\'`x90B|cq@iSsEnu,(l-hf.&Y_?J#R]+voQXU8mrV[!p4tg~OMez CAaGFD6H53%L/dT2<*>"{\\wI=',
    'vCiJ<oZ9|phXVNn)m K`t/SI%]A5qOWe\\&?;jT~M!fz1l>[D_0xR32c*4.P"G{r7}E8wUgyudF+6-:B=$(sY,LkbHa#\'@Q',
    'hvMX,\'4Ty;[a8/{6l~F_V"}qLI\\!@x(D7bRmUH]W15J%N0BYPkrs&9:$)Zj>u|zwQ=ieC-oGA.#?tfdcO3gp`S+En K2*<',
    'jd!W5[];4\'<C$/&x|rZ(k{>?ghBzIFN}fAK"#`p_TqtD*1E37XGVs@0nmSe+Y6Qyo-aUu%i8c=H2vJ\\) R:MLb.9,wlO~P',
    '2ThtjEM+!=xXb)7,ZV{*ci3"8@_l-HS69L>]\\AUF/Q%:qD?1~m(yvO0e\'<#o$p4dnIzKP|`NrkaGg.ufCRB[; sJYwW}5&',
    'vB\\5/zl-9y:Pj|=(R\'7QJI *&CTX"p0]_3.idcuOefVU#omwNZ`$Fs?L+1Sk<,b)hM4A6[Y%aDrg@~KqEW8t>H};n!2xG{',
    'sFz0Bo@_HfnK>LR}qWXV+D6`Y28=4Cm~G/7-5A\\b9!a#rP.l&M$hc3ijQk;),TvUd<[:I"u1\'NZSOw]*gxtE{eJp|y (?%',
    'M@,D}|LJyGO8`$*ZqH .j>c~h<d=fimszv[#-53F!+a;NC\'6T91IV?(0x&/{B)w"]Q\\YUWprk4:ol%g2nE7teRKbAPuS_X',
    '.mjY#_0*H<B=Q+FML6]s;r2:e8R}[ic&KA 1w{)vV5d,$u"~xD/Pg?IyfthO@CzWp%!`N4Z\'3-(o|J9XUE7k\\TlqSb>anG',
    'xVa1\']_GU<X`|\\NgM?LS9{"jT%s$}y[nvtlefB2RKJW~(/cIDCPow4,>#zm+:5b@06O3Ap8=*7ZFY!H-uEQk; .q)i&rhd',
    'I]Jz7AG@QX."%3Lq>METUo{Pp_ |a6<0dYVSv8:b)~W9NK`(r\'4fs&wim\\kReC2hg=HOj$1B*/nxt,;c#y+![?lFuZ-5D}',
    'Rr(Ge6F Hx>q$m&C%M~Tn,:"o\'tX/*yP.{lZ!YkiVhuw_<KE5a[;}W0gjsz3]@7cI2\\QN?f#4p|vb1OUBD9)=-LJA+d`S8',
    'I~k>y|m};d)-7DZ"Fe/Y<B:xwojR,Vh]O0Sc[`$sg8GXE!1&Qrzp._W%TNK(=J 3i*2abuHA4C\'?Mv\\Pq{n#56LftUl@9+',
    '~A*>9 WidFN,1KsmwQ)GJM{I4:C%}#Ep(?HB/r;t.&U8o|l[\'Lg"2hRDyZ5`nbf]qjc0!zS-TkYO<_=76a\\X@$Pe3+xVvu',
    'yYgjf"5VdHc#uA,W1i+v\'6|@pr{n;DJ!8(btPGaQM.LT3oe?NB/&9>Z`-}02*%x<7lsqz4OS ~E$\\R]KI[:UwC_=h)kXmF',
    '5:iar.{YU7mBZR@-K|2 "+~`M%8sq4JhPo<_X\\Sg3WC;Tuxz,fvEQ1p9=w}FAI&j/keD0c?)LN6OHV]lGy\'$*>nd[(tb!#',
];

const CIPHER_PAD_OSEHRA = [
    "VEB_0|=f3Y}m<5i$`W>znGA7P:O%H69[2r)jKh@uo\\wMb*Da !+T?q4-JI#d;8ypUQ]g\"~'&Cc.LNt/kX,e{vl1FRZs(xS",
    "D/Jg><p]1W6Rtqr.QYo8TBEMK-aAIyO(xG7lPz;=d)N}2F!U ,e0~$fk\"j[m*3s5@XnZShv+`b'{u&_\\9%|wL4ic:V?H#C",
    "?lBUvZq\\fwk+u#:50`SOF9,dp&*G-M=;{8Ai6/N7]bQ1szC!(PxW_YV~)3Lm.EIXD2aT|hKj$rnR@[\"c g'<>t%4oJHy}e",
    "MH,t9K%TwA17-Bzy+XJU?<>4mo @=6:Ipfnx/Y}R8Q\\aN~{)VjEW;|Sq]rl[0uLFd`g5Z#e!3$b\"P_.si&G(2'Cvkc*ODh",
    "vMy>\"X?bSLCl)'jhzHJk.fVc6#*[0OuP@\\{,&r(`Es:K!7wi$5F; DoY=p%e<t}4TQA2_W9adR]gNBG1~nIZ+3x-Um|8q/",
    ":\"XczmHx;oA%+vR$Mtr CBTU_w<uEK5f,SW*d8OaFGh]j'{7-~Qp#yqP>09si|VY1J!/[lN23&L4`=.D6)ZIb\\n?}(ek@g",
    "j7Qh[YU.u6~xm<`vfe%_g-MRF(#iK=trl}C)>GEDN *$OdHzBA98aLJ|2WP:@ko0wy4I/S&,q']5!13XcVs\\?Zp\"+{;Tbn",
    "\\UVZ;.&]%7fGq`*SA=Kv/-Xr1OBHiwhP5ukYo{2\"}d |NsT,>!x6y~cz[C)pe8m9LaRI(MEFlt:Qg#D'n$W04b@_+?j<3J",
    "MgSvV\"U'dj5Yf6K*W)/:z$oi7GJ|t(1Ak=ZC,@]Q0?8DnbE[+L`{mq>;aOR}wcB4sF_e9rh2l\\x<. PyNpu%IT!&3#HX~-",
    "rFkn4Z0cH7)`6Xq|yL #wmuW?Gf!2YES;.B_D=el}hN[M&x(*AasU9otd+{]g>TQjp<:v%5O\"zI\\@$Rb~8i-3/'V1,CJPK",
    "\\'%u+W)mK41L#:A6!;7(\"tnyRlaOe09]3EFd ITf.`@P[Q{B$_iYhZo*kbc|HUgz=D>Svr8x,X~-<NsjM}C/&J?p2wV5qG",
    "QCl_329e+DTp&\\?jNys V]k*M\"X!$Y6[i@g>{RvF'01(45LJZU,:-uAwtB;7|%fx.n`IhSE<OoW~=bdP#/KHzrc)8mG}aq",
    "!{w*PR[B9Oli~T, rFc\"/?ast8=)-_Dgo<E#n4HYA%f'N;0@S7pJ`kGIedM|+C2yjvL5b3K6\\Z]V(.h}umxz>XQ$qUW:1&",
    "}:SHZ|O~A-bcyJ4%'5vM+ ;eo.$B)Vp\\,kTDz1sGL`]*=mg2nxYPd&lErN3[8qF0@u\"a_>wQKI{f6C7?9RX(t#i/U<j!Wh",
    ",ry*|7<1keO:Wi C/zh4IZ>x!F[_(\"Dbu%Hl5Pg=]QG.LKcJ0&ont@+{;ATX6jMwBv?2#f`q\\}VYm'8Es$NpU)dR~S9a3-",
    "h,=/:pJ$@mlY-`bwQ)e3Xt8.RUSMV 2A;j[PN}TE9x~kL&<ns5q>_#c1%K+rIuFoa(zyDWdH]?\\GB0g*4f6\"Z!'v{7|OiC",
    "/$*b.ts0vOx_-o\"l3MHI~}!E`eJimPd>Sn&wzFUh?Kf4)g5X<,8pD:9LA{a[k;'|GyYQ=R2B\\#q+cru6N1W@(C TV]7Z%j",
    "qEoC?YWNtV{Brg,I(i:e7Jd#6m!D8XT\"n[$~1*ZcxL.Kh2s4%Q&ju\\5Gvazw+9pF@k`HA)=U3/< -}'0b;|PfSRl_MO]y>",
    "`@X:!R[\\tY5OBcZPh$rM_a-\"vgJG%|}oIH)wWQ*jDVxlp,'+S zu(&7?>KCn4y1dE02q6b<;F=8]9NAmT{Li3f/esUk.~#",
    "\\Zr';/SMsG76Lj$aBc[#k>u=_O@2J&X{Aft xV4~vz8Q}q)0K.NIpRnYwDhg+<\"H-!(PF:m*]?,WCT|dE9o53%`liUey1b",
];

const CIPHER_PADS = {
    VA: CIPHER_PAD_VA,
    OSEHRA: CIPHER_PAD_OSEHRA,
};

const DEFAULT_CIPHER = CIPHER_PADS.VA;

/**
 * Encrypt a string using the RPC protocol cipher-based encryption method.
 * @param  {String} str - The string to encrypt
 * @param  {String} [cipherName='VA'] The name of the encryption cipher to use. The encryption utility
 * currently comes with two named ciphers: `VA` (the default) and `OSEHRA`. You can use your own custom
 * encryption cipher as well. Just `include` the `CIPHER_PADS` object from this module, which is just a
 * JS object, then insert the cipher (array of 20 strings) into the object, where the key of the cipher
 * in the object is the name you'd use here.
 * @return {String} The encrypted string, or an empty string if an invalid string was passed in.
 */
const encrypt = (str, cipherName = 'VA') => {
    if (!isString(str) || str.length <= 0) {
        return '';
    }
    const cipher = CIPHER_PADS[cipherName] || DEFAULT_CIPHER;

    let ra = 0;
    let rb = 0;
    while (ra === rb) {
        ra = random(cipher.length - 1);
        rb = random(cipher.length - 1);
    }
    const cra = cipher[ra].split('');
    const crb = cipher[rb].split('');

    const startChar = String.fromCharCode(ra + 32);
    const endChar = String.fromCharCode(rb + 32);
    const encodedStr = str.split('').map((ch) => {
        const index = cra.indexOf(ch);
        return (index > -1 ? crb[index] : ch);
    }).join('');

    return `${startChar}${encodedStr}${endChar}`;
};

/**
 * Decrypt a string that was encrypted using the RPC protocol cipher-based encryption method.
 * @param  {String} str - The encrypted string to decrypt
 * @param  {String} [cipherName='VA'] The name of the encryption cipher to use. The encryption utility
 * currently comes with two named ciphers: `VA` (the default) and `OSEHRA`. You can use your own custom
 * encryption cipher as well. Just `include` the `CIPHER_PADS` object from this module, which is just a
 * JS object, then insert the cipher (array of 20 strings) into the object, where the key of the cipher
 * in the object is the name you'd use here.
 * @return {String} The descrypted string, or an empty string if an invalid string was passed in.
 */
const decrypt = (str, cipherName = 'VA') => {
    if (!isString(str) || str.length < 3) {
        return '';
    }

    const cipher = CIPHER_PADS[cipherName] || DEFAULT_CIPHER;
    const ra = str.charCodeAt(0) - 32;
    const rb = str.charCodeAt(str.length - 1) - 32;

    if (ra < 0 || ra >= cipher.length || rb < 0 || rb >= cipher.length) {
        return '';
    }

    const cra = cipher[ra].split('');
    const crb = cipher[rb].split('');

    const result = str.split('').slice(1, -1).map((ch) => {
        const index = crb.indexOf(ch);
        return (index > -1 ? cra[index] : ch);
    });

    return result.join('');
};

module.exports = {
    CIPHER_PADS,
    encrypt,
    decrypt,
};
