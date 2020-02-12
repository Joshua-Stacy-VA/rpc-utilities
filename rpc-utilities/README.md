# RPC Utilities
Utilities to handle manipulation and normalization of VISTA RPC data

## Background
This repository used to be titled `rpcParseFormat`, but because we've added more functionality to this
low-level utility module, we decided to change the name. This library is intended to provide utility
functionality to deal with low-level, raw VISTA RPC data. This includes:

* [Parsing](https://github.com/vistadataproject/rpc-utilities/wiki/RPC-Utilities-API#module_Parser) (low-level RPC protocol strings to RPC data objects)
* [Formatting](https://github.com/vistadataproject/rpc-utilities/wiki/RPC-Utilities-API#module_Formatter) (RPC data objects to low-level RPC protocol strings)
* [Encryption/Decryption](https://github.com/vistadataproject/rpc-utilities/wiki/RPC-Utilities-API#module_) (encrypting and decrypting data based on the RPC protocol)
* [Normalization](https://github.com/vistadataproject/rpc-utilities/wiki/RPC-Utilities-API#RPC) (JS Object representation and functionality for handling RPC data)
