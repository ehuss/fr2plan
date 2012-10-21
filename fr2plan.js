
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
	// A, B are first version k=1, 2
	// C, D are second version, k=1, 2
	var compress_code = String.fromCharCode("A".charCodeAt(0)+min_k+1);
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

function uncompress(cdata, k) {
	return uncompress_rice(cdata, k);
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


var worlds = [
	{name: "Hometown",
	 levels: [
		{name: "Meanwhile...",
		 img: "Meanwhile.jpg",
		 tile_x: 66,
		 tile_y: 132,
		 spacing: 51.5,
		 rounds: 20,
		 layout: [[0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0]
		         ]
		},
		{name: "Hocus Poke Us",
		 img: "Hocus Poke Us.jpg",
		 tile_x: 130,
		 tile_y: 126,
		 spacing: 52,
		 rounds: 25,
		 layout: [[0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0]
		         ]
		},
		{name: "Carnie Guarding",
		 img: "Carnie Guarding.jpg",
		 tile_x: 128,
		 tile_y: 126,
		 spacing: 52,
		 rounds: 30,
		 layout: [[0,0,0,1,0,0,0,0,0,0,0],
		          [0,0,0,1,0,0,1,0,1,0,0],
		          [0,1,0,0,0,1,0,0,0,0,0],
		          [0,1,0,1,0,0,0,0,0,1,0],
		          [0,0,0,0,0,0,0,1,0,0,1],
		          [1,0,0,0,1,1,0,0,1,0,0],
		          [0,0,0,0,0,0,0,0,0,0,0]
		         ]
		},
		{name: "The Mean Streets",
		 img: "The Mean Streets.jpg",
		 tile_x: 148,
		 tile_y: 265,
		 spacing: 50.5,
		 rounds: 20, //XXX update 0/1000
		 layout: [[0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0],
		          [1,1,1,2,0,1,1,1,1,2,0,1,1,1,1,2,0,1,1,1,1],
		          [0,0,0,1,1,1,0,0,0,1,1,1,0,0,0,1,1,1,0,0,0]
		         ]
		},
		{name: "Be Mine",
		 img: "Be Mine.jpg",
		 tile_x: 135,
		 tile_y: 116,
		 spacing: 52,
		 rounds: 21,
		 layout: [[0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0]
		         ]
		},
		{name: "Last Limbo",
		 img: "Last Limbo.jpg",
		 tile_x: 135,
		 tile_y: 116,
		 spacing: 52,
		 rounds: 30,
		 layout: [[0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0]
		         ]
		}
	 ],
	},
	{name: "Grasslands",
	 levels: [
		{name: "Twist of Fate",
		 img: "Twist of Fate.jpg",
		 tile_x: 117,
		 tile_y: 170,
		 spacing: 52.5,
		 rounds: 50,
		 layout: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,1,1,1,0,1,1,1,1,1,0,0],
				  [0,0,1,0,0,0,1,0,1,0,0,0,1,0,0],
				  [1,1,1,0,1,1,1,1,1,1,1,0,1,1,1],
				  [1,1,1,0,1,0,1,0,1,0,1,0,1,1,1],
				  [1,1,0,0,1,1,1,0,1,1,1,0,0,1,1],
				  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
				  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0]
			 	 ]
		},
		{name: "Clonehenge",
		 img: "Clonehenge.jpg",
		 tile_x: 170,
		 tile_y: 132,
		 spacing: 51.5,
		 rounds: 20, // XXX 0/1000
		 layout: [[0,0,0,0,0,0,0,0,0,0,0,0],
				  [1,1,1,1,1,1,1,1,1,0,0,0],
				  [1,0,0,0,0,0,0,0,1,1,1,1],
				  [1,0,0,0,0,0,0,0,0,1,1,1],
				  [1,0,0,0,0,0,0,0,0,1,1,1],
				  [1,0,0,0,0,0,0,0,0,1,1,1],
				  [1,0,0,1,1,1,1,1,1,1,1,1],
				  [1,1,1,1,0,0,0,0,0,0,0,0],
				  [0,0,0,0,0,0,0,0,0,0,0,0]
				 ]
		},
		{name: "Speedhenge",
		 img: "Speedhenge.jpg",
		 tile_x: 142,
		 tile_y: 100,
		 spacing: 51.5,
		 rounds: 20, // timer
		 layout: [[0,0,0,0,0,0,0,0,1],
		          [0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0],
		          [1,0,0,0,0,0,0,0,1],
		          [0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,0],
		          [0,0,0,0,0,0,0,0,1]
		 		 ]
		},
		{name: "Broken Branch",
		 img: "Broken Branch.jpg",
		 tile_x: 78,
		 tile_y: 117,
		 spacing: 52,
		 rounds: 60, // xxx 0/200
		 layout: [[2,2,2,2,2,2,2,2,2,2,2,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
		 		  [1,1,1,1,0,1,1,1,1,0,1,1,1,0,1],
		 		  [1,1,1,1,1,1,0,1,1,1,1,1,0,0,1],
		 		  [1,1,1,0,1,1,1,1,1,0,1,1,1,0,1],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
		 		  [2,2,2,2,2,2,2,2,2,0,0,0,0,0,0]
		 		 ]
		},
		{name: "Home on Derange",
		 img: "Home on Derange.jpg",
		 tile_x: 79,
		 tile_y: 175,
		 spacing: 52,
		 rounds: 70,
		 layout: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
		 		 ]
		},
		{name: "Tangled Turnpike",
		 img: "Tangled Turnpike.jpg",
		 tile_x: 159,
		 tile_y: 88,
		 spacing: 52,
		 rounds: 70,
		 layout: [[0,1,1,1,1,1,0,0,0,0,2,2,2],
		 		  [2,1,0,0,0,1,0,0,0,0,2,2,2],
		 		  [1,1,0,0,1,1,1,1,0,0,2,2,2],
		 		  [0,0,1,1,1,1,0,1,0,0,0,0,0],
		 		  [0,0,1,0,1,0,0,1,0,0,0,0,0],
		 		  [1,1,1,1,1,1,1,1,0,1,1,1,1],
		 		  [0,0,1,0,1,0,0,0,0,1,0,0,0],
		 		  [0,0,1,0,1,1,1,1,1,1,0,0,0],
		 		  [0,0,1,0,0,0,0,0,0,0,0,0,0],
		 		  [2,2,1,1,1,1,1,1,1,1,1,2,2]
		 		 ]
		},
		{name: "Tangled Express",
		 img: "Tangled Express.jpg",
		 tile_x: 162,
		 tile_y: 90,
		 spacing: 52,
		 rounds: 70, // xxx timed
		 layout: [[0,1,1,1,1,1,0,0,0,0,2,2,2],
		 		  [2,1,0,0,0,1,0,0,0,0,2,2,2],
		 		  [1,1,0,0,1,1,1,1,0,0,2,2,2],
		 		  [0,0,1,1,1,1,0,1,0,0,0,0,0],
		 		  [0,0,1,0,1,0,0,1,0,0,0,0,0],
		 		  [1,1,1,1,1,1,1,1,0,1,1,1,1],
		 		  [0,0,1,0,1,0,0,0,0,1,0,0,0],
		 		  [0,0,1,0,1,1,1,1,1,1,0,0,0],
		 		  [0,0,1,0,0,0,0,0,0,0,0,0,0],
		 		  [2,2,1,1,1,1,1,1,1,1,1,2,2]
		 		 ]
		}
	 ],
	},
	{name: "Drylands",
	 levels: [
		{name: "Bizarre Bazaar",
		 img: "Bizarre Bazaar.jpg",
		 tile_x: 168,
		 tile_y: 157,
		 spacing: 51.5,
		 rounds: 70,
		 layout: [[0,0,0,0,0,0,1,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0],
				  [0,0,0,0,0,0,1,0,0,0,0,0,0],
				  [1,0,0,0,0,1,1,1,0,0,0,0,1],
				  [0,0,0,0,0,0,1,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,1,0,0,0,0,0,0]
		 		 ]
		},
		{name: "Dry Run",
		 img: "Dry Run.jpg",
		 tile_x: 156,
		 tile_y: 128,
		 spacing: 52,
		 rounds: 20, ///xxx 0/1000
		 layout: [[0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0],
		 		  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
		 		  [0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0],
		 		  [0,0,0,1,0,0,0,0,0,1,1,1,1,1,1,0,0],
		 		  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1],
		 		  [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
		 		  [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
		 		  [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
		 		  [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1]
		 		 ]
		},
		{name: "Dryer Straits",
		 img: "Dryer Straits.jpg",
		 tile_x: 176,
		 tile_y: 163,
		 spacing: 52,
		 rounds: 70,
		 layout: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,1,1,1,1,1,0,0,0],
		 		  [1,0,0,0,0,0,1,0,0,0,1,0,0,0],
		 		  [0,0,0,1,1,1,1,0,0,0,1,1,1,1],
		 		  [0,0,0,1,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,0,0,0,0,0,0,0,0,0,0],
		 		  [1,1,1,0,0,0,0,0,0,0,0,0,0,0],
		 		  [1,1,0,0,0,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Turbo Dryer",
		 img: "Turbo Dryer.jpg",
		 tile_x: 168,
		 tile_y: 162,
		 spacing: 52,
		 rounds: 70, /// xxx 0/400 in 6min
		 layout: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,1,1,1,1,1,0,0,0],
		 		  [1,0,0,0,0,0,1,0,0,0,1,0,0,0],
		 		  [0,0,0,1,1,1,1,0,0,0,1,1,1,1],
		 		  [0,0,0,1,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,0,0,0,0,0,0,0,0,0,0],
		 		  [1,1,1,0,0,0,0,0,0,0,0,0,0,0],
		 		  [1,1,0,0,0,2,2,2,2,2,2,2,2,2]
		 		 ]
		},
		{name: "Cardio Canyon",
		 img: "Cardio Canyon.jpg",
		 tile_x: 203,
		 tile_y: 139,
		 spacing: 52,
		 rounds: 60,
		 layout: [[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,1,0,0,0,1,1,1,1,1,0,0,0],
		 		  [1,1,1,0,1,1,1,1,1,0,0,0,1,0,0,0],
		 		  [0,0,1,1,1,0,0,0,0,0,0,1,1,0,0,0],
		 		  [0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,0],
		 		  [1,0,0,0,1,1,1,0,1,1,1,1,0,0,0,1],
		 		  [0,0,0,0,1,0,1,1,1,0,0,0,0,0,0,0],
		 		  [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,2,2]
		 		 ]
		},
		{name: "Curious Gorge",
		 img: "Curious Gorge.jpg",
		 tile_x: 130,
		 tile_y: 122,
		 spacing: 52,
		 rounds: 60,
		 layout: [[1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
				  [1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,1]
		 		 ]
		}
	 ],
	},
	{name: "Lavaflow",
	 levels: [
		{name: "The Frying Pan",
		 img: "The Frying Pan.jpg",
		 tile_x: 126,
		 tile_y: 156,
		 spacing: 52,
		 rounds: 80,
		 layout: [[4,4,4,4,0,0,0,0,0,0,0,2,2,0,0,0,2],
		 		  [4,0,0,0,0,0,0,0,0,0,0,2,2,0,2,0,2],
		 		  [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
		 		  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
		 		  [0,0,1,0,0,0,1,1,0,0,0,2,2,0,0,1,0],
		 		  [0,1,1,0,0,0,0,0,1,1,0,0,2,2,0,1,0],
		 		  [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
		 		  [0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,1,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0],
		 		  [0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,1,4],
		 		  [4,4,4,0,0,4,4,4,0,4,4,4,2,2,2,4,4]
		 		 ]
		},
		{name: "Scrambled Eggs",
		 img: "Scrambled Eggs.jpg",
		 tile_x: 126,
		 tile_y: 154,
		 spacing: 51.5,
		 rounds: 80, // XXX 0/325 in 5 min
		 layout: [[4,4,4,4,0,0,0,0,0,0,0,2,2,0,0,0,2],
		 		  [4,0,0,0,0,0,0,0,0,0,0,2,2,0,2,0,2],
		 		  [0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
		 		  [0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
		 		  [0,0,1,0,0,0,1,1,0,0,0,2,2,0,0,1,0],
		 		  [0,1,1,0,0,0,0,0,1,1,0,0,2,2,0,1,0],
		 		  [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0],
		 		  [0,1,0,0,0,0,0,0,0,0,0,0,2,2,0,1,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0],
		 		  [0,0,0,0,1,0,0,0,0,0,0,0,1,1,0,1,4],
		 		  [4,4,4,0,0,4,4,4,0,4,4,4,2,2,2,4,4]
		 		 ]
		},
		{name: "Ring of Fire",
		 img: "Ring of Fire.jpg",
		 tile_x: 208,
		 tile_y: 162,
		 spacing: 51.5,
		 rounds: 50,
		 layout: [[2,2,2,2,2,4,4,4,4,0,0,0,0,0,2,2,2,2],
		 		  [4,4,4,0,2,4,2,2,2,1,1,1,2,0,0,4,4,4],
		 		  [4,0,0,0,0,0,0,0,0,1,0,1,0,0,2,0,0,4],
		 		  [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2,4],
		 		  [1,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
		 		  [1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,0,0],
		 		  [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,2,2,2,2,2,2,2,0,2,0,2,0,0,0,2],
		 		  [0,1,0,4,4,4,4,0,0,0,0,0,0,0,0,1,0,2]
		 		 ]
		},
		{name: "Flash Fire",
		 img: "Flash Fire.jpg",
		 tile_x: 211,
		 tile_y: 163,
		 spacing: 52,
		 rounds: 50, // xxx 0/275 in 5:15
		 layout: [[2,2,2,2,2,4,4,4,4,0,0,0,0,0,2,2,2,2],
		 		  [4,4,4,0,2,4,2,2,2,1,1,1,2,0,0,4,4,4],
		 		  [4,0,0,0,0,0,0,0,0,1,0,1,0,0,2,0,0,4],
		 		  [0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,2,4],
		 		  [1,1,1,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
		 		  [1,0,1,1,1,1,1,0,0,1,0,0,0,0,0,1,0,0],
		 		  [1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
		 		  [0,0,0,2,2,2,2,2,2,2,0,2,0,2,0,0,0,2],
		 		  [0,1,0,4,4,4,4,0,0,0,0,0,0,0,0,1,0,2]
		 		 ]
		},
		{name: "High Steaks",
		 img: "High Steaks.jpg",
		 tile_x: 159,
		 tile_y: 160,
		 spacing: 51.5,
		 rounds: 50, // xxx 0/1000 in 3 health
		 layout: [[4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0],
		 		  [4,4,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,1,0,4,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0],
		 		  [0,0,0,0,0,4,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
		 		  [1,1,1,1,1,1,1,1,1,0,0,0,0,4,0,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0],
		 		  [0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0],
		 		  [1,1,1,1,1,1,1,0,0,0,0,4,0,1,1,1,1,1,1,1],
		 		  [4,4,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
		 		  [4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0]
		 		 ]
		},
		{name: "End of Doom",
		 img: "End of Doom.jpg",
		 tile_x: 113,
		 tile_y: 99,
		 spacing: 51.5,
		 rounds: 70,
		 layout: [[0,4,4,4,4,4,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		 		  [0,2,2,2,2,2,2,0,2,2,2,2,2,2,2,2,4,4,4,2,2,2,2],
		 		  [0,0,0,0,0,2,2,0,2,2,2,2,2,2,2,2,0,0,0,2,2,2,2],
		 		  [0,0,4,0,0,1,1,0,1,1,1,1,1,1,1,1,0,0,0,2,2,2,2],
		 		  [0,0,4,0,0,0,0,0,2,0,0,0,2,2,2,2,0,0,0,2,2,2,2],
		 		  [0,0,0,0,0,2,2,2,2,0,0,0,2,2,2,2,0,0,0,2,2,2,2],
		 		  [0,0,0,0,0,2,1,4,4,0,0,0,2,2,2,2,0,0,0,0,0,2,2],
		 		  [0,2,2,2,0,2,0,2,4,0,0,0,0,0,2,2,0,0,0,2,4,2,2],
		 		  [0,2,2,2,0,0,0,2,0,0,0,0,0,2,0,2,4,4,4,2,4,2,2],
		 		  [0,2,2,2,0,2,2,2,0,0,0,0,0,2,2,0,2,2,2,2,4,2,2],
		 		  [0,0,0,0,0,4,4,0,0,4,0,0,0,1,1,1,0,1,1,1,4,2,1],
		 		  [0,2,2,2,2,2,2,0,2,4,4,0,2,2,2,2,0,2,2,2,0,2,1],
		 		  [4,0,0,0,4,2,2,0,2,0,4,4,2,2,2,2,4,2,2,2,0,2,1],
		 		  [4,0,0,0,4,2,2,0,2,0,0,0,2,2,2,2,4,0,0,0,1,1,1],
		 		  [4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2]
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
		{name: "Gatling",
		 position_y: 330,
		 select_y: 225,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Machine Gun",
		 position_y: 1320,
		 select_y: 675,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Glue",
		 position_y: 495,
		 select_y: 300,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Ice",
		 position_y: 825,
		 select_y: 450,
		 shape: "circle",
		 outer_radius: 1.5,
		 inner_radius: 0
		},
		{name: "Missile",
		 position_y: 1650,
		 select_y: 825,
		 shape: "circle",
		 outer_radius: 3.5,
		 inner_radius: 0
		},
		{name: "Oil",
		 position_y: 1980,
		 select_y: 975,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Sonic Blast",
		 position_y: 2970,
		 select_y: 1575,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Spark",
		 position_y: 3135,
		 select_y: 1650,
		 shape: "square",
		 outer_radius: 1.5
		},
		{name: "Slow Link",
		 position_y: 2805,
		 select_y: 1500,
		 shape: "square",
		 outer_radius: 1.5
		},
		{name: "Cannon",
		 position_y: 0,
		 select_y: 0,
		 shape: "circle",
		 outer_radius: 3.5,
		 inner_radius: 1
		},
		{name: "Hive",
		 position_y: 660,
		 select_y: 375,
		 shape: "circle",
		 outer_radius: 3.5,
		 inner_radius: 0
		},
		{name: "Laser",
		 position_y: 990,
		 select_y: 525,
		 shape: "cross",
		 outer_radius: 2.5
		},
		{name: "Gas",
		 position_y: 330,
		 select_y: 150,
		 shape: "???"
		},
		{name: "Link",
		 position_y: 1155,
		 select_y: 600,
		 shape: "square",
		 outer_radius: 1.5
		},
		{name: "Flamethrower",
		 position_y: 165,
		 select_y: 75,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Plague",
		 position_y: 330,
		 select_y: 1050,
		 shape: "???"
		},
		{name: "Zap",
		 position_y: 330,
		 select_y: 1800,
		 shape: "???"
		},
		{name: "Plasma",
		 position_y: 2145,
		 select_y: 1125,
		 shape: "cross",
		 outer_radius: 3.5
		},
		{name: "Power",
		 position_y: 330,
		 select_y: 1200,
		 shape: "???"
		},
		{name: "Radiation",
		 position_y: 2475,
		 select_y: 1350,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Tesla",
		 position_y: 3300,
		 select_y: 1725,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Pyro",
		 position_y: 2310,
		 select_y: 1275,
		 shape: "circle",
		 outer_radius: 2.5,
		 inner_radius: 0
		},
		{name: "Mine",
		 position_y: 1485,
		 select_y: 750,
		 shape: "square",
		 outer_radius: 1.5
		},
		{name: "Nuke",
		 position_y: 1815,
		 select_y: 900,
		 shape: "circle",
		 outer_radius: 3.5,
		 inner_radius: 1.5
		},
		{name: "Railgun",
		 position_y: 2640,
		 select_y: 1425,
		 shape: "circle",
		 outer_radius: 5.5,
		 inner_radius: 1.5
		}
]

$.each(towers, function(tindex, tower) {
	tower.tower_num = tindex;
});

var current_tower = 0;
// level object from worlds object.
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
// 2D array of objects:
// {img: The "div" object.
//  tower: The tower object.
//  tower_level: The level number.
// }
// Undefined if no image.
var tower_images = null;
// Array of "div" objects matching the order in "towers".
var tower_selectors = null;

function set_tile_tower(row, col, tower_num, tower_level, fade)
{
	var tower = towers[tower_num];
	var img_pos = tower.position_y+((tower_level-1)*55);

	if (typeof tower_images[row][col] == "undefined") {
		var map_img_pos = $("#map-img").position();
		var img = $("<div/>").appendTo("#map").
		css({
			background: "url('images/towers/towers-0.2.png') 0px -"+img_pos+"px",
			width: 50,
			height: 50,
			position: "absolute",
			left: current_level.tile_x+col*current_level.spacing,
			top: current_level.tile_y+row*current_level.spacing
		}).bind("contextmenu", function() {
			remove_tower(row, col);
			return false;	// Prevent context menu from showing.
		}).click(function() {
			tile_click(row, col);
		});
		tower_images[row][col] = {
			img: img,
			tower: tower,
			tower_level: tower_level
		};
	} else {
		var ti = tower_images[row][col];
		if (ti.tower == tower && ti.tower_level == tower_level) {
			// Already showing the correct tower.
			fade = false;
		} else {
			ti.tower = tower;
			ti.tower_level = tower_level;
			ti.img.css("background-position", "0px -"+img_pos+"px");
		}
	}
	if (fade) {
		tower_images[row][col].img.hide().fadeIn(400);
	}
}

function clear_tile_tower(row, col, dofade)
{
	var ti = tower_images[row][col];
	if (typeof ti != "undefined") {
		delete tower_images[row][col];
		if (dofade) {
			ti.img.fadeOut(400, function() {
				ti.img.detach();
			});
		} else {
			ti.img.detach();
		}
	}
}

function set_round_number_display(rnum)
{
	$("#round-number")[0].innerHTML="Round "+rnum+"/"+max_rounds;
}

function change_round(rnum)
{
	set_round_number_display(rnum);
	current_round = rnum;
	var tbround = tower_build[rnum-1];
	for (var row_i=0; row_i<tbround.length; row_i++) {
		var row = tbround[row_i];
		for (var col_i=0; col_i<row.length; col_i++) {
			var t = row[col_i];
			if (typeof t.tower_num === 'undefined') {
				// Clear this.
				clear_tile_tower(row_i, col_i, true);
			} else {
				// Set to the appropriate tower.
				set_tile_tower(row_i, col_i, t.tower_num, t.tower_level, true);
			}
		}
	}

}

function add_max_rounds(num)
{
	max_rounds += num;
	for (var i=max_rounds-num; i<max_rounds; i++) {
		init_round_data(i);
	}
	// Propagate towers into the new rounds.
	var last_tb = tower_build[max_rounds-num-1];
	for (var i=max_rounds-num; i<max_rounds; i++) {
		var tb = tower_build[i];
		for (var row_num=0; row_num<tb.length; row_num++) {
			var row = tb[row_num];
			for (var col_num=0; col_num<row.length; col_num++) {
				if (typeof last_tb[row_num][col_num].tower_num != 'undefined') {
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

function init_round_data(round_num)
{
	var round = new Array(current_level.layout.length);
	for (var row_i=0; row_i<current_level.layout.length; row_i++) {
		var row = current_level.layout[row_i];
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
	moves = new Array(max_rounds);
	tower_build = new Array(max_rounds);
	for(i=0; i<max_rounds; i++) {
		init_round_data(i);
	}
}

function init_tower_images()
{
	if (tower_images != null) {
		$.each(tower_images, function(row_i, row) {
			$.each(row, function(col_i, ti) {
				if (typeof ti != "undefined") {
					ti.img.detach();
				}
			})
		})
	}
	tower_images = new Array(current_level.layout.length);
	var rowsize = current_level.layout[0].length;
	for (var i=0; i<tower_images.length; i++) {
		tower_images[i] = new Array(rowsize);
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
	current_level = level;
	select_tower(0);
	load_template("#mapTmpl", level, "#body");

	function do_map_tile_click(this_offset, x, y) {
		var x_offset = (x-this_offset.left)-level.tile_x;
		var y_offset = (y-this_offset.top) -level.tile_y;
		var row_num = Math.floor(y_offset / level.spacing);
		var col_num = Math.floor(x_offset / level.spacing);
		console.log("x_offset="+x_offset+" y_offset="+y_offset+" row_num="+row_num+" col_num="+col_num);
		tile_click(row_num, col_num);
	}

	$("#map-img").click(function(e) {
		do_map_tile_click($(this).offset(), e.pageX, e.pageY);
	}).droppable({
		drop: function(e, ui) {
			do_map_tile_click($(this).offset(), ui.offset.left+ui.helper.width()/2,
			                                    ui.offset.top+ui.helper.width()/2);
		}
	});
	init_tower_images();
	init_tower_build();
	init_slider();
	document.title = level.name;
	//test_layout();
}

function test_layout()
{
	$.each(current_level.layout, function (row_i, row) {
		$.each(row, function (tile_i, tilenum) {
			if (tilenum == 0) {
				tile_click(row_i, tile_i);
			}
		});
	});
}

function tile_click(row_num, col_num)
{
	if (row_num < 0 || col_num < 0 ||
		row_num >= current_level.layout.length ||
		col_num >= current_level.layout[0].length) {
		// Click outside of grid.
		return;
	}
	var cell = current_level.layout[row_num][col_num];
	if (cell == 0) {
		// -1 because round is 1-based.
		var b = tower_build[current_round-1][row_num][col_num];
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
		propagate_change(row_num, col_num, b.tower_num, b.tower_level);
		update_tower_image(row_num, col_num, b.tower_num, b.tower_level);
	}

	update_code();
}

function propagate_change(row_num, col_num, tower_num, tower_level)
{
	// Propagate this change to future levels.
	for (var i=current_round; i<max_rounds; i++) {
		tower_build[i][row_num][col_num] = {
			tower_num: tower_num,
			tower_level: tower_level
		};
		remove_move(i+1, row_num, col_num);
	}
}

function update_tower_image(row_num, col_num, tower_num, tower_level)
{
	if (typeof tower_num == "undefined") {
		clear_tile_tower(row_num, col_num, false);
	} else {
		set_tile_tower(row_num, col_num, tower_num, tower_level, false);
	}
}

function remove_tower(row_num, col_num)
{
	var b = tower_build[current_round-1][row_num][col_num];
	if (typeof b.tower_num != "undefined") {
		clear_move(row_num, col_num);
		delete b.tower_num;
	}
	propagate_change(row_num, col_num, b.tower_num, b.tower_level);
	update_tower_image(row_num, col_num, b.tower_num, b.tower_level);
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
	// tower == 1 means next value indicates how many moves back to upgrade.
	var simple = new Array();
	var movelist = new Array();
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
				if (n == -1 || n > 25) {
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
	var newloc = jQuery.param.fragment(window.location.href, {l:current_level.name, m:b64}, 2);
	history.replaceState({level:current_level.name, moves:b64}, current_level.name, newloc);
}

function load_moves(m) {
	var version_code = m.charCodeAt(0) - "A".charCodeAt(0);
	var k;
	var fix_old_rows = false;
	if (version_code==0 || version_code==1) {
		// First version.
		k = version_code+1;
		fix_old_rows = true;
	} else {
		// Second version, removed outer rows/colums, so need to adjust.
		k = version_code-1;
	}
	var cdata;
	if (fix_old_rows) {
		cdata = $.base64old.decode(m.slice(1));
	} else {
		cdata = $.base64.decode(m.slice(1));
	}
	var data = uncompress(cdata, k);
	console.log("uncompressed data: "+data);

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
				if (fix_old_rows) {
					row_num -= 1;
					col_num -= 1;
				}
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
					clear_tile_tower(row_num, col_num, true);
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

function select_tower(tower_num)
{
	var old_tower = towers[current_tower];
	tower_selectors[current_tower].css("background-position", "0px -"+old_tower.select_y+"px");
	var new_tower = towers[tower_num];
	current_tower = tower_num;
	tower_selectors[tower_num].css("background-position", "75px -"+new_tower.select_y+"px");
}

function draw_outline(tower, opacity)
{
	var canvas_dim = tower.outer_radius*52.5;
	var canvas = $("<canvas/>").attr({width:canvas_dim*2+2+"px",height:canvas_dim*2+2+"px"});
	if (tower.shape == "circle") {
		canvas.drawArc({
			fillStyle: "#62b72d",
			strokeWidth: 2,
			strokeStyle: "#88e45d",
			opacity: opacity,
			x: canvas_dim,
			y: canvas_dim,
			radius: canvas_dim
		});
	if (tower.inner_radius != 0) {
		canvas.drawArc({
			compositing: "destination-out",
			fillStyle: "#000",
			opacity: 1.0,
			x: canvas_dim,
			y: canvas_dim,
			radius: tower.inner_radius*52.5
		}).
		drawArc({
			strokeWidth: 2,
			strokeStyle: "#88e45d",
			opacity: opacity,
			x: canvas_dim,
			y: canvas_dim,
			radius: tower.inner_radius*52.5
		})
	}
	} else if (tower.shape == "square") {
		canvas.drawRect({
			fillStyle: "#62b72d",
			strokeWidth: 2,
			strokeStyle: "#88e45d",
			opacity: opacity,
			x: canvas_dim,
			y: canvas_dim,
			width: tower.outer_radius*52.5*2,
			height: tower.outer_radius*52.5*2
		});
	} else if (tower.shape == "cross") {
		var orad = tower.outer_radius*52.5;
		canvas.drawLine({
			fillStyle: "#62b72d",
			strokeWidth: 2,
			strokeStyle: "#88e45d",
			opacity: opacity,
			x1:  orad-(52.5/2), y1:  orad-(52.5/2),
			x2:  orad-(52.5/2), y2:  0,
			x3:  orad+(52.5/2), y3:  0,
			x4:  orad+(52.5/2), y4:  orad-(52.5/2),
			x5:  orad*2,        y5:  orad-(52.5/2),
			x6:  orad*2,        y6:  orad+(52.5/2),
			x7:  orad+(52.5/2), y7:  orad+(52.5/2),
			x8:  orad+(52.5/2), y8:  orad*2,
			x9:  orad-(52.5/2), y9:  orad*2,
			x10: orad-(52.5/2), y10: orad+(52.5/2),
			x11: 0, 			y11: orad+(52.5/2),
			x12: 0, 			y12: orad-(52.5/2),
			x13: orad-(52.5/2), y13: orad-(52.5/2)
		})
	}
	return canvas;
}

function draw_tower_outlines(event, ui)
{
	$.each(tower_images, function(rowi, row) {
		$.each(row, function(coli, ti) {
			if (typeof ti != "undefined") {
				if (ti.tower.tower_num == current_tower) {
					var c = draw_outline(ti.tower, 0.25);
					c.addClass("tower-outline");
					c.appendTo(ti.img);
					c.position({of:ti.img});
				}
			}
		});
	});
}

function remove_tower_outlines(event, ui)
{
	$(".tower-outline").detach();
}

function load_tower_select()
{
	tower_selectors = new Array(towers.length);

	$.each(towers, function(i, tower) {
		var x_pos, y_pos;
		if (i < Math.floor(towers.length/2)) {
			x_pos = i*75;
			y_pos = 0;
		} else {
			x_pos = (i - Math.floor(towers.length/2)) * 75;
			y_pos = 70;
		}
		// The 2.5 spacing here is not always accurate (due to resizing the
		// maps, the tiles are always about 50 pixels, but the spacing varies
		// a little).
		var canvas_dim = tower.outer_radius*52.5;
		var img = $("<div/>", {title: tower.name}).appendTo("#towers").
		css({
			background: "url('images/tower-select/tower-select.png') 0px -"+tower.select_y+"px",
			width: 75,
			height: 70,
			position: "absolute",
			left: x_pos,
			top: y_pos
		}).mousedown(function() {
			select_tower(i);
		}).draggable({
			//containment: "#tower-drag-area",
			cursorAt: {
				top: canvas_dim,
				left: canvas_dim
			},
			helper: function(event) {
				var c = draw_outline(tower, 0.5);
				c.drawImage({
					source: "images/towers/towers-0.2.png",
					x: canvas_dim,
					y: canvas_dim,
					sx: 0,
					sy: tower.position_y,
					sWidth: 50,
					sHeight: 50,
					cropFromCenter: false
				});
				return c;
			},
			start: draw_tower_outlines,
			stop: remove_tower_outlines
		});
		tower_selectors[i] = img;
	});
}

function initialize()
{
	load_template("#worldsTmpl", {worlds: worlds}, "#worlds");
	load_tower_select();

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
			if (current_level !== level) {
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
