
/***************************************************************************/
function BitStore() {
	this.bits = 0;
	this.num_bits = 0;
	this.result = new Array();
}

BitStore.prototype.add_bit = function(bit) {
	this.num_bits += 1;
	this.bits <<= 1;
	if (bit != 0) {
		this.bits |= 1;
	}
	if (this.num_bits == 8) {
		this.result.push(String.fromCharCode(this.bits));
		this.num_bits = 0;
		this.bits = 0;
	}
}

BitStore.prototype.add_bits = function(bits, num) {
	var remaining = num;
	var tmp = bits;
	while (remaining > 0) {
		this.add_bit((tmp & 0x80));
		tmp <<= 1;
		remaining -= 1;
	}
}

BitStore.prototype.flush = function(ones) {
	if (this.num_bits) {
		this.bits <<= (8-this.num_bits);
		if (ones) {
			this.bits |= (0xFF >> this.num_bits);
		}
		this.result.push(String.fromCharCode(this.bits));
		this.num_bits = 0;
		this.bits = 0;
	}
}

/***************************************************************************/

function BitReader(data) {
	this.data = data;
	this.index = 0;
	this.bits = 0;
	this.num_bits = 0;
	this.result = new Array();
}

BitReader.prototype.get_bit = function() {
	if (this.num_bits == 0) {
		if (this.index < this.data.length) {
			this.num_bits = 8;
			this.bits = this.data.charCodeAt(this.index);
			this.index += 1;
		} else {
			return -1;
		}
	}
	this.num_bits -= 1;
	return (this.bits >> this.num_bits) & 1;
}

BitReader.prototype.get_bits = function(num_bits) {
	var remaining = num_bits;
	var shifts = 8 - remaining;
	var result = 0;
	while (remaining > 0) {
		var bit = this.get_bit();
		if (bit == -1) {
			return -1;
		}
		result <<= 1;
		result |= bit;
		remaining -= 1;
	}
	result <<= shifts;
	return result;
}

/***************************************************************************/


function compress(data) {
	// Pick the k value that gives best compression.
	var compressed = [];
	var min_length = 0xFFFF;
	var min_k = -1;
	for (var k=1; k<3; k++) {
		var cdata = compress_rice(data, k);
		if (cdata.length < min_length) {
			min_length = cdata.length;
			min_k = k;
		}
		compressed.push(cdata);
	}
	var compress_code = String.fromCharCode("A".charCodeAt(0)+min_k-1);
	return compress_code + $.base64.encode(compressed[min_k-1]);
}

function compress_rice(data, k) {
	var mask = 0xFF >> (8 - k);
	var bs = new BitStore();
	for (var i=0; i<data.length; i++) {
		var c = data[i];
		var unary = c;
		unary >>= k;
		while (unary > 0) {
			unary -= 1;
			bs.add_bit(1);
		}
		bs.add_bit(0);
		var binary = (c & mask) << (8 - k);
		bs.add_bits(binary, k);
	}
	bs.flush(true);
	return bs.result.join("");
}

function uncompress(data) {
	var k = (data.charCodeAt(0) - "A".charCodeAt(0)) + 1;
	var cdata = data.slice(1);
	var compressed = $.base64.decode(cdata);
	return uncompress_rice(compressed, k);
}

function uncompress_rice(data, k) {
	var br = new BitReader(data);
	var result = new Array();
	var b = 0;
	while (true) {
		var bit = br.get_bit();
		if (bit == -1) {
			break;
		}
		if (bit == 1) {
			b += 1;
		} else {
			var tmp = b << k;
			b = br.get_bits(k);
			if (b == -1) {
				break;
			}
			b = (b >> (8-k)) | tmp;
			result.push(b);
			b = 0;
		}
	}
	return result;
}


/***************************************************************************/


var tile_path = "images/map-tiles/";

var tiles = [
	// 0
	{name: "open",
	 img: tile_path+"blank.png"
	},
	// 1
	{name: "trench",
     img: tile_path+"trench.png",
    },
    // 2
    {name: "blocked",
     img: tile_path+"blocked.png"
    },
    // 3
    {name: "box",
     img: tile_path+"box.png"
    },
    // 4
    {name: "fire",
	 img: tile_path+"fire.png"
	}
]

var worlds = [
	{name: "Hometown",
	 levels: [
		{name: "Meanwhile...",
		 rounds: 20,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2],
		          [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		},
		{name: "Hocus Poke Us",
		 rounds: 25,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,3,0,0,0,0,0,3,0,0,0,2],
		          [2,0,0,3,0,3,0,0,0,0,0,0,2],
		          [2,3,0,3,0,3,0,0,3,0,0,0,2],
		          [1,0,0,0,0,0,0,0,3,0,3,0,1],
		          [2,3,0,3,0,0,3,0,3,0,0,3,2],
		          [2,0,0,0,3,3,0,3,0,0,0,0,2],
		          [2,0,0,3,0,0,0,0,0,0,3,0,2],
		          [2,2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		},
		{name: "Carnie Guarding",
		 rounds: 30,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [1,0,0,0,0,0,0,0,0,0,0,1],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		          [2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		},
		{name: "The Mean Streets",
		 rounds: 20, //XXX update 0/1000
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,1],
		          [1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1],
		          [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		},
		{name: "Be Mine",
		 rounds: 21,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		},
		{name: "Last Limbo",
		 rounds: 30,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,0,0,0,0,0,0,0,0,0,0,1],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2]
		         ]
		}
	 ],
	},
	{name: "Grasslands",
	 levels: [
		{name: "Twist of Fate",
		 rounds: 50,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
			 	  [2,0,0,1,1,1,1,1,0,1,1,1,1,1,0,0,2],
			 	  [2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2],
			 	  [1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1],
			 	  [1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1],
			 	  [1,1,1,0,0,1,1,1,0,1,1,1,0,0,1,1,1],
			 	  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
			 	  [2,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,2],
			 	  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
			 	 ]
		},
		{name: "Clonehenge",
		 rounds: 20, // XXX 0/1000
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,2],
				  [1,1,1,1,1,1,1,1,1,1,0,0,0,2],
				  [2,1,0,0,0,0,0,0,0,1,1,1,1,2],
				  [2,1,0,0,0,0,0,0,0,0,1,1,1,2],
				  [1,1,0,0,0,0,0,0,0,0,1,1,1,1],
				  [2,1,0,0,0,0,0,0,0,0,1,1,1,2],
				  [2,1,0,0,1,1,1,1,1,1,1,1,1,2],
				  [1,1,1,1,1,0,0,0,0,0,0,0,0,2],
				  [2,0,0,0,0,0,0,0,0,0,0,0,0,2],
				  [2,2,2,2,2,2,2,2,2,2,2,2,2,2]
				 ]
		},
		{name: "Speedhenge",
		 rounds: 20, // timer
		 layout: [[2,2,2,2,2,2,2,2,2,2,2],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [1,1,0,0,0,0,0,0,0,1,1],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [2,0,0,0,0,0,0,0,0,0,2],
		          [2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Broken Branch",
		 rounds: 60, // xxx 0/200
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,2],
		 		  [1,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1],
		 		  [1,1,1,1,1,1,1,0,1,1,1,1,1,0,0,1,1],
		 		  [1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2],
		 		  [2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Home on Derange",
		 rounds: 70,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Tangeld Turnpike",
		 rounds: 70,
		 layout: [[1,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [1,0,1,1,1,1,1,0,0,0,0,2,2,2,2],
		 		  [1,2,1,0,0,0,1,0,0,0,0,2,2,2,2],
		 		  [1,1,1,0,0,1,1,1,1,0,0,2,2,2,2],
		 		  [2,0,0,1,1,1,1,0,1,0,0,0,0,0,2],
		 		  [2,0,0,1,0,1,0,0,1,0,0,0,0,0,2],
		 		  [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
		 		  [2,0,0,1,0,1,0,0,0,0,1,0,0,0,2],
		 		  [2,0,0,1,0,1,1,1,1,1,1,0,0,0,2],
		 		  [2,0,0,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,2,2,1,1,1,1,1,1,1,1,1,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,1,2,2]
		 		 ]
		},
		{name: "Tangled Express",
		 rounds: 70, // xxx timed
		 layout: [[1,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [1,0,1,1,1,1,1,0,0,0,0,2,2,2,2],
		 		  [1,2,1,0,0,0,1,0,0,0,0,2,2,2,2],
		 		  [1,1,1,0,0,1,1,1,1,0,0,2,2,2,2],
		 		  [2,0,0,1,1,1,1,0,1,0,0,0,0,0,2],
		 		  [2,0,0,1,0,1,0,0,1,0,0,0,0,0,2],
		 		  [1,1,1,1,1,1,1,1,1,0,1,1,1,1,1],
		 		  [2,0,0,1,0,1,0,0,0,0,1,0,0,0,2],
		 		  [2,0,0,1,0,1,1,1,1,1,1,0,0,0,2],
		 		  [2,0,0,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,2,2,1,1,1,1,1,1,1,1,1,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,1,2,2]
		 		 ]
		}
	 ],
	},
	{name: "Drylands",
	 levels: [
		{name: "Bizarre Bazaar",
		 rounds: 70,
		 layout: [[2,2,2,2,2,2,2,1,2,2,2,2,2,2,2],
		 		  [2,0,0,0,0,0,0,1,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
				  [2,0,0,0,0,0,0,1,0,0,0,0,0,0,2],
				  [1,1,0,0,0,0,1,1,1,0,0,0,0,1,1],
				  [2,0,0,0,0,0,0,1,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,1,0,0,0,0,0,0,2],
		 		  [2,2,2,2,2,2,2,1,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Dry Run",
		 rounds: 20, ///xxx 0/1000
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,1],
		 		  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
		 		  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
		 		  [1,0,0,0,1,0,0,0,0,0,1,1,1,1,1,1,0,0,1],
		 		  [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1],
		 		  [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
		 		  [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
		 		  [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
		 		  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Dryer Straits",
		 rounds: 70,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,1,1,1,1,1,0,0,0,2],
		 		  [1,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
		 		  [2,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1],
		 		  [2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,1,1,0,0,0,2,2,2,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Turbo Dryer",
		 rounds: 70, /// xxx 0/400 in 6min
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,1,1,1,1,1,0,0,0,2],
		 		  [1,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
		 		  [2,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1],
		 		  [2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,1,1,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,1,1,0,0,0,2,2,2,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Cardio Canyon",
		 rounds: 60,
		 layout: [[1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,0,0,1,1,1,0,0,0,1,1,1,1,1,0,0,0,2],
		 		  [1,1,1,1,0,1,1,1,1,1,0,0,0,1,0,0,0,2],
		 		  [2,0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0,2],
		 		  [2,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,0,2],
		 		  [1,1,0,0,0,1,1,1,0,1,1,1,1,0,0,0,1,1],
		 		  [2,0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,1,1,1,1,1,1,1,1,1,1,0,0,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2]
		 		 ]
		},
		{name: "Curious Gorge",
		 rounds: 60,
		 layout: [[2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2],
		 		  [1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
				  [1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1,1],
				  [2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2]
		 		 ]
		}
	 ],
	},
	{name: "Lavaflow",
	 levels: [
		{name: "The Frying Pan",
		 rounds: 80,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,4,4,4,4,0,0,0,0,0,0,0,2,2,0,0,0,2,2],
		 		  [2,4,0,0,0,0,0,0,0,0,0,0,2,2,0,2,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,2],
		 		  [2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,2],
		 		  [2,0,0,1,0,0,0,1,1,0,0,0,2,2,0,0,1,0,2],
		 		  [2,0,1,1,0,0,0,0,0,1,1,0,0,2,2,0,1,0,2],
		 		  [2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,2],
		 		  [2,0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,1,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,2],
		 		  [2,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,4,2],
		 		  [2,4,4,4,0,0,4,4,4,0,4,4,4,2,2,2,4,4,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Scrambled Eggs",
		 rounds: 80, // XXX 0/325 in 5 min
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,4,4,4,4,0,0,0,0,0,0,0,2,2,0,0,0,2,2],
		 		  [2,4,0,0,0,0,0,0,0,0,0,0,2,2,0,2,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,2],
		 		  [2,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,2],
		 		  [2,0,0,1,0,0,0,1,1,0,0,0,2,2,0,0,1,0,2],
		 		  [2,0,1,1,0,0,0,0,0,1,1,0,0,2,2,0,1,0,2],
		 		  [2,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,2],
		 		  [2,0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,1,0,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,2],
		 		  [2,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,4,2],
		 		  [2,4,4,4,0,0,4,4,4,0,4,4,4,2,2,2,4,4,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Ring of Fire",
		 rounds: 50,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,4,4,4,4,0,0,0,0,0,2,2,2,2,2],
		 		  [2,4,4,4,0,2,4,2,2,2,1,1,1,2,0,0,4,4,4,2],
		 		  [2,4,0,0,0,0,0,0,0,0,1,0,1,0,0,2,0,0,4,2],
		 		  [2,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2,4,2],
		 		  [2,1,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [1,1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,0,0,1],
		 		  [2,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,2,2,2,2,2,2,2,0,2,0,2,0,0,0,2,2],
		 		  [2,0,1,0,4,4,4,4,0,0,0,0,0,0,0,0,1,0,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Flash Fire",
		 rounds: 50, // xxx 0/275 in 5:15
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,4,4,4,4,0,0,0,0,0,2,2,2,2,2],
		 		  [2,4,4,4,0,2,4,2,2,2,1,1,1,2,0,0,4,4,4,2],
		 		  [2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,4,2],
		 		  [2,0,0,0,0,0,0,1,1,1,1,2,1,0,0,0,0,2,4,2],
		 		  [2,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [1,1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,1,1,1],
		 		  [2,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
		 		  [2,0,0,0,2,2,2,2,2,2,2,0,2,0,2,0,0,0,2,2],
		 		  [2,0,1,1,4,4,4,4,1,1,1,1,1,1,1,1,1,0,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "High Steaks",
		 rounds: 50, // xxx 0/1000 in 3 health
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [1,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,1],
		 		  [1,4,4,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,1,1,0,4,0,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,4,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,4,0,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,1],
		 		  [1,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,1],
		 		  [1,1,1,1,1,1,1,1,0,0,0,0,4,0,1,1,1,1,1,1,1,1],
		 		  [1,4,4,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1],
		 		  [1,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,1],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "End of Doom",
		 rounds: 70,
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,4,4,4,4,4,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [2,0,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,4,4,4,2,2,2,2,2],
		 		  [2,0,0,0,0,0,2,2,0,2,2,2,2,2,2,2,2,0,0,0,2,2,2,2,2],
		 		  [2,0,0,4,0,0,1,1,0,1,1,1,1,1,1,1,1,0,0,0,2,2,2,2,2],
		 		  [2,0,0,4,0,0,0,0,0,2,0,0,0,2,2,2,2,0,0,0,2,2,2,2,2],
		 		  [2,0,0,0,0,0,2,2,2,2,0,0,0,2,2,2,2,0,0,0,2,2,2,2,2],
		 		  [2,0,0,0,0,0,2,1,4,4,0,0,0,2,2,2,2,0,0,0,0,0,2,2,2],
		 		  [2,0,2,2,2,0,2,0,2,4,0,0,0,0,0,2,2,0,0,0,2,4,2,2,2],
		 		  [2,0,2,2,2,0,0,0,2,0,0,0,0,0,2,0,2,4,4,4,2,4,2,2,2],
		 		  [2,0,2,2,2,0,2,2,2,0,0,0,0,0,2,2,0,2,2,2,2,4,2,2,2],
		 		  [1,0,0,0,0,0,4,4,0,0,4,0,0,0,1,1,1,0,1,1,1,4,2,1,1],
		 		  [2,0,2,2,2,2,2,2,0,2,4,4,0,2,2,2,2,0,2,2,2,0,2,1,2],
		 		  [2,4,0,0,0,4,2,2,0,2,0,4,4,2,2,2,2,4,2,2,2,0,2,1,2],
		 		  [2,4,0,0,0,4,2,2,0,2,0,0,0,2,2,2,2,4,0,0,0,1,1,1,2],
		 		  [2,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2],
		 		  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
		 		 ]
		}
	 ],
	}
]

// For easier access.
var levels = {};
$.each(worlds, function(windex, world) {
	$.each(world.levels, function(lindex, level) {
		levels[level.name] = level;
		level.world = world;
		level.level_num = lindex;
	});
	world.world_num = windex;
});


var towers = [
		{imgname: "gatling"
		},
		{imgname: "machine-gun"
		},
		{imgname: "glue"
		},
		{imgname: "ice"
		},
		{imgname: "missile"
		},
		{imgname: "oil"
		},
		{imgname: "sonic-blast"
		},
		{imgname: "spark"
		},
		{imgname: "slow-link"
		},
		{imgname: "cannon"
		},
		{imgname: "hive"
		},
		{imgname: "laser"
		},
		{imgname: "gas"
		},
		{imgname: "link"
		},
		{imgname: "flamethrower"
		},
		{imgname: "plague"
		},
		{imgname: "zap"
		},
		{imgname: "plasma"
		},
		{imgname: "power"
		},
		{imgname: "radiation"
		},
		{imgname: "tesla"
		},
		{imgname: "pyro"
		},
		{imgname: "mine"
		},
		{imgname: "nuke"
		},
		{imgname: "railgun"
		}
]

var current_tower = 0;
// Integer indexes into worlds array.
var current_world = null;
var current_level = null;

// List of rounds.
// Each round is a 2d array of the map.  Each element is an object with these
// attributes:
// - tower_num
// - tower_level (1-based)
var tower_build = null;
// moves is an an array of rounds.
// Each element is an array of these arrays: [tower_num, tower_level, row, col]
// tower_level = 4 means to clear the square.
var moves = null;
var current_round = 1;
var max_rounds = null;

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function set_map_img(row, col, imgname, ffunc)
{
	var img = $("#map-table tr:nth-child("+(row+1)+") td:nth-child("+(col+1)+") img");
	if (!endsWith(img[0].src, imgname)) {
		if (ffunc) {
			ffunc(img, imgname);
		} else {
			img[0].src = imgname;
		}
	}
}
function set_tile_img(level, row, col, fade)
{
	var tilenum = level.layout[row][col];
	var ffunc;
	if (fade) {
		ffunc = function(img, imgname) {
			img.fadeTo(50, 0.0, function() {
				img[0].src = imgname;
				img.fadeTo(400, 1.0);
			})
		}
	}
	set_map_img(row, col, tiles[tilenum].img, ffunc);
}
function set_tile_tower(row, col, tower_num, tower_level, fade)
{
	var tower = towers[tower_num];
	var imgname = "images/towers/"+tower.imgname+tower_level+".png";
	var ffunc;
	if (fade) {
		ffunc = function(img, imgname) {
			img[0].src = imgname;
			img.css({opacity: 0.0});
			img.fadeTo(400, 1.0);
		}
	}
	set_map_img(row, col, imgname, ffunc);
}

function set_round_number_display(rnum)
{
	$("#round-number")[0].innerHTML="Round "+rnum+"/"+max_rounds;
}

function change_round(rnum)
{
	var level = worlds[current_world].levels[current_level];
	set_round_number_display(rnum);
	current_round = rnum;
	var tbround = tower_build[rnum-1];
	for (var row_i=0; row_i<tbround.length; row_i++) {
		var row = tbround[row_i];
		for (var col_i=0; col_i<row.length; col_i++) {
			var t = row[col_i];
			if (typeof t.tower_num == 'undefined') {
				// Clear this.
				set_tile_img(level, row_i, col_i, true);
			} else {
				// Set to the appropriate tower.
				set_tile_tower(row_i, col_i, t.tower_num, t.tower_level, true);
			}
		}
	}

}

function add_max_rounds(num)
{
	var level = worlds[current_world].levels[current_level];
	max_rounds += num;
	for (var i=max_rounds-num; i<max_rounds; i++) {
		init_round_data(level, i);
	}
	// Propagate towers into the new rounds.
	var last_tb = tower_build[max_rounds-num-1];
	for (var i=max_rounds-num; i<max_rounds; i++) {
		var tb = tower_build[i];
		for (var row_num=0; row_num<tb.length; row_num++) {
			var row = tb[row_num];
			for (var col_num=0; col_num<row.length; col_num++) {
				if (last_tb[row_num][col_num].tower_num != 'undefined') {
					var last_tower = last_tb[row_num][col_num];
					row[col_num] = {
						tower_num: last_tower.tower_num,
						tower_level: last_tower.tower_level
					};
				}
			}
		}
	}
	// Have to include "value" to force jquery to refresh the slider.
	$("#round-slider").slider({max:max_rounds, value:current_round});
	set_round_number_display(current_round);
}

function init_slider()
{
	$("#round-slider").slider({min:1, max:max_rounds, value:1,
		slide: function(event, ui) {
			change_round(parseInt(ui.value));
		}
	});
	change_round(1);
	// Add a button if it's not already there.
	if (!$("#round-add-button").length) {
		$("#round-adder").append("<button id=\"round-add-button\">Add 10 Rounds</button>");
		$("#round-add-button").button()
		    .click(function() {
				if (max_rounds < 250) {
					add_max_rounds(10);
				}
			});
	}

}

function init_round_data(level, round_num)
{
	var round = new Array(level.layout.length);
	for (var row_i=0; row_i<level.layout.length; row_i++) {
		var row = level.layout[row_i];
		var round_row = new Array(row.length);
		for (var col_i=0; col_i<row.length; col_i++) {
			round_row[col_i] = {};
		}
		round[row_i] = round_row;
	}
	tower_build[round_num] = round;
	moves[round_num] = new Array();
}

function init_tower_build()
{
	var level = worlds[current_world].levels[current_level];
	moves = new Array(max_rounds);
	tower_build = new Array(max_rounds);
	for(i=0; i<max_rounds; i++) {
		init_round_data(level, i);
	}
}

function load_template(tmpl, context, dest)
{
	var source = $(tmpl).html();
	var tmpl = Handlebars.compile(source);
	var html = tmpl(context);
	//console.log(html);
	$(dest).html(html);
}

function level_select(level)
{
	max_rounds = level.rounds;
	current_level = level.level_num;
	current_world = level.world.world_num;
	current_tower = 0;
	load_template("#mapTmpl", level, "#map");
	init_tower_build();
	init_slider();
	document.title = level.name;
}

function tower_select(tower_num)
{
	current_tower = tower_num;
}

function tile_click(row_num, col_num)
{
	// if (current_tower==null) {
	// 	alert("Select a tower first.");
	// 	return;
	// }
	var level = worlds[current_world].levels[current_level];
	var cell = level.layout[row_num][col_num];
	if (cell == 0) {
		// -1 because round is 1-based.
		var b = tower_build[current_round-1][row_num][col_num]
		if (typeof b.tower_num == "undefined") {
			// Empty square, add lvl 1 tower.
			b.tower_num = current_tower;
			b.tower_level = 1;
			add_move(current_tower, 1, row_num, col_num);
		} else {
			if (b.tower_level < 3) {
				// Tower upgrade.
				b.tower_level += 1;
				add_move(b.tower_num, b.tower_level, row_num, col_num);
			} else {
				// Make the square empty.
				// Clear out any previous changes on this round.
				clear_move(row_num, col_num);
				delete b.tower_num;
			}
		}
		// Propagate this change to future levels.
		for (var i=current_round; i<max_rounds; i++) {
			tower_build[i][row_num][col_num] = {
				tower_num: b.tower_num,
				tower_level: b.tower_level
			};
			remove_move(i+1, row_num, col_num);
		}
		// Update the image.
		if (typeof b.tower_num == "undefined") {
			set_tile_img(level, row_num, col_num);
		} else {
			set_tile_tower(row_num, col_num, b.tower_num, b.tower_level);
		}
	}

	update_code();
}

function add_move(tower_num, tower_level, row_num, col_num)
{
	var round_moves = moves[current_round-1];
	// Try to see if this is just a level bump.
	var found = false;
	for (var i=0; i<round_moves.length; i++) {
		var move = round_moves[i];
		if (move[2]==row_num && move[3]==col_num) {
			if (move[0] != tower_num) {
				move[0] = tower_num;
			}
			move[1] = tower_level;
			found = true;
			break;
		}
	}
	if (!found) {
		round_moves.push([tower_num, tower_level, row_num, col_num]);
	}
}
// round_num is 1-based
function remove_move(round_num, row_num, col_num) {
	var round_moves = moves[round_num-1];
	for (var i=0; i<round_moves.length; i++) {
		var move = round_moves[i];
		if (move[2]==row_num && move[3]==col_num) {
			round_moves.splice(i, 1);
			break;
		}
	}
}

function clear_move(row_num, col_num) {
	// Only add a "level 4" clear tower if it existed in a previous round.
	for (var round_num=current_round-1; round_num>0; round_num--) {
		var round_moves = moves[round_num-1];
		for (var move_num=0; move_num < round_moves.length; move_num++) {
			var round_move = round_moves[move_num];
			if (round_move[2] == row_num && round_move[3] == col_num) {
				if (round_move[1] != 4) {
					// A tower existed here previously, we need to clear it.
					remove_move(current_round, row_num, col_num);	// May not match.
					add_move(0, 4, row_num, col_num);
					return;
				}
			}
		}
	}
	// There was never a tower at this square previously.  No need to add a remove.
	remove_move(current_round, row_num, col_num);
}

function update_code()
{
	// Simplify the moves into [(rounddiff, moves)]
	// moves is list of (tower+2, level, row, col)
	// tower == 0 is last move of round
	// tower == 1 means next value indicates how man moves back to upgrade.
	var simple = new Array();
	var movelist = new Array();
	var level = worlds[current_world].levels[current_level];
	var round_diff = 0;


	function check_upgrade(move) {
		for (var i=movelist.length; i>0; i--) {
			var m = movelist[i-1];
			if (m[2] == move[2] && m[3] == move[3]) {
				if (m[0] == move[0]) {
					if (m[1] != (move[1]-1)) {
						// Tower upgrade from lvl1 to lvl3.  Could include two
						// upgrade moves, but to keep things simple just
						// include the lvl 3 data.
						return -1;
					} else {
						return movelist.length - i;
					}
				}
				// Change of tower.
				return -1;
			}
		}
		// This square was empty.
		return -1;
	}


	for (var round_num=0; round_num<max_rounds; round_num++) {
		var round_moves = moves[round_num];
		if (round_moves.length == 0) {
			round_diff += 1;
		} else {
			simple.push(round_diff);
			round_diff = 0;
			// Add each move to simple.
			// Upgrade is treated specially.
			for (var move_num=0; move_num<round_moves.length; move_num++) {
				var move = round_moves[move_num];
				// See if this is an upgrade of a previous tower.
				var n = check_upgrade(move);
				if (n == -1) {
					// Not an upgrade.
					simple.push(move[0]+2);
					simple.push(move[1]);
					simple.push(move[2]);
					simple.push(move[3]);
				} else {
					simple.push(1);
					simple.push(n);
				}
				movelist.push(move);
			}
			// End of round.
			simple.push(0);
		}
	}

	console.log(simple);
	var b64 = compress(simple);
	console.log(b64);
	var newloc = jQuery.param.fragment(window.location.href, {l:level.name, m:b64}, 2);
	history.replaceState({level:level.name, moves:b64}, level.name, newloc);
}

function load_moves(m) {
	var data = uncompress(m);
	console.log("uncompressed data: "+data);

	var level = worlds[current_world].levels[current_level];

	// round diffs are zero based.
	// round_number is 0 based.
	var round_number = -1;
	var tower_num, tower_level, row_num, col_num;
	var movelist = new Array();

	for (var i=0; i<data.length;) {
		round_number += data[i]+1;
		if (round_number >= max_rounds) {
			if (round_number > 250) {
				alert("Too many rounds.");
				return;
			}
			add_max_rounds(round_number-max_rounds+1);
		}
		i += 1;
		while (i<data.length) {
			var tower_num = data[i];
			i += 1;
			if (tower_num == 0) {
				// End of round.
				break;
			}
			if (tower_num == 1) {
				// Tower upgrade.
				var moves_back = data[i];
				i += 1;
				var move = movelist[movelist.length-moves_back-1];
				tower_num = move[0];
				tower_level = move[1]+1;
				row_num = move[2];
				col_num = move[3];
			} else {
				tower_num -= 2;
				tower_level = data[i++];
				row_num = data[i++];
				col_num = data[i++];
			}
			var b = tower_build[round_number][row_num][col_num];
			if (tower_level == 4) {
				delete b.tower_num;
			} else {
				b.tower_num = tower_num;
				b.tower_level = tower_level;
			}
			// Propagate this change to future levels.
			for (var r=round_number+1; r<max_rounds; r++) {
				tower_build[r][row_num][col_num] = {
					tower_num: b.tower_num,
					tower_level: b.tower_level
				}
			}
			if (round_number == 0) {
				// Update the image.
				if (typeof b.tower_num == "undefined") {
					set_tile_img(level, row_num, col_num);
				} else {
					set_tile_tower(row_num, col_num, b.tower_num, b.tower_level, true);
				}
			}
			// Update moves list.
			var round_moves = moves[round_number];
			round_moves.push([tower_num, tower_level, row_num, col_num]);
			movelist.push([tower_num, tower_level, row_num, col_num]);
		}
	}
}

function initialize()
{
	load_template("#worldsTmpl", {worlds: worlds}, "#worlds");
	var tower_rows = {towers:[
			{tower_row: towers.slice(0,towers.length/2)},
			{tower_row: towers.slice(towers.length/2)}
		]}
	// Needed since towers are in two rows, can't use index from myeach.
	for (var i=0; i<towers.length; i++) {
		towers[i].number = i;
	}
	load_template("#towersTmpl", tower_rows, "#towers");

	$(".level").mouseover(function() {
		var t = $(this);
		if (!t.hasClass('level-selected')) {
			t.addClass('level-hover');
		}
	}).mouseout(function() {
		$(this).removeClass('level-hover');
	}).click(function() {
		var t = $(this);
		$(".level").removeClass('level-selected');
		t.addClass('level-selected');
		t.removeClass('level-hover');
		var parts = this.id.split('-');
		var worldi = parseInt(parts[1]);
		var leveli = parseInt(parts[2]);
		var level = worlds[worldi].levels[leveli];
		level_select(level);
		var newloc = jQuery.param.fragment(window.location.href, {l:level.name}, 2);
		history.pushState({level:level.name}, level.name, newloc);
	});

	$(document).bind('keydown', 'right', function() {
		if (tower_build != null) {
			var level = worlds[current_world].levels[current_level];
			if (current_round < max_rounds) {
				$("#round-slider").slider("value", current_round+1);
				change_round(current_round+1);
			}
		}
	});

	$(document).bind('keydown', 'left', function() {
		if (tower_build != null) {
			if (current_round >1) {
				$("#round-slider").slider("value", current_round-1);
				change_round(current_round-1);
			}
		}
	});

	function change_level(level) {
		if (level) {
			var world = level.world;
			if (current_level != level.level_num || current_world != world.world_num) {
				// Remove any highlighting.
				$(".level").removeClass("level-selected");
				// And highlight this one.
				$("#level-"+world.world_num+"-"+level.level_num).addClass("level-selected");
				// Load the level.
				level_select(level);
			}
		}

	}

	// History traversal.
	$(window).bind('popstate', function(e) {
		console.log("popstate "+e.state);
		if (e.state && e.state.level) {
			// History navigation.
			var level = levels[e.state.level];
			change_level(level);
		} else {
			// Initial visit.
			var frag = jQuery.deparam.fragment();
			if (frag && frag.l) {
				var level = levels[frag.l];
				change_level(level);
				if (frag.m) {
					load_moves(frag.m);
				}
			}
		}
	});

	console.log("Initializing.");
	// Handle initial loading with a fragment.
	$(window).trigger('popstate');
}

Handlebars.registerHelper('myeach', function(array, options) {
	var fn = options.fn;
	var buffer = "";
	for (var i=0, j=array.length; i<j; i++) {
		var item = array[i];
		if (!(item instanceof Object)) {
			// For numbers, like in the layout.
			item = {value: item}
		}
		item.index = i;
		buffer += fn(item);
	}
	return buffer;
});

Handlebars.registerHelper('maptile', function(tilenum) {
	return tiles[tilenum].img;
});

$(document).ready(initialize);


// function dump() {
// 	for (var i=0; i<tower_build.length; i++) {
// 		var round = tower_build[i];
// 		console.log("round "+i);
// 		for (var y=0; y<round.length; y++) {
// 			console.log("row"+y);
// 			row = round[y];
// 			for (var x=0; x<row.length; x++) {
// 				item = row[x];
// 				console.log("col"+x+" t="+item.tower_num+" l="+item.tower_level);
// 			}
// 		}
// 	}
// }
