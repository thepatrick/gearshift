/* Gearshift, v0.1 
 * Copyright (c) 2007 Patrick Quinn-Graham
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

Gearshift = {
	init: function(a_db, auto_migrate) {
		this.db = a_db;
		if(auto_migrate) {
			latest_version = this.latestVersion();
			this.migrateTo(latest_version);
		}
	},
	execSql: function(sql, params) {
		// Taken from the awesome GearsAdmin demo app		
		try {
	    	var rs = Gearshift.db.execute(sql, params);
			var rows = new Array();
			var i = -1;
		    while (rs.isValidRow()) {
			   	i++;
		    	var row = new Object();
		    	for(var j=0; j<rs.fieldCount(); j++) {
		    		row[rs.fieldName(j)] = rs.field(j);
				}
				rows[i] = row;
				rs.next();
			} 
	    	return {success: true, data: rows};
		} catch (e) {
			return {success: false, message: e.message};
	  	}	
	},
	latestVersion: function() {
		my_max_version = 0;
		$A(this.rules).each(function(a,b) {
			my_max_version = b;
		});
		return my_max_version;
	},
	initializeGearshiftDB: function() {
		create_table = this.execSql("CREATE TABLE schema_info (version INT)");
		if(!create_table.success) {
			alert("Gearshift setup failed, couldn't create schema_info table.");
			return;
		}
		insert_default_migration = this.execSql("INSERT INTO schema_info (version) VALUES (0)");
	},
	setMyVersion: function(i) {
		this.execSql("UPDATE schema_info SET version = ?", [i]);
	},
	whatIsMyVersion: function() {
		b = this.execSql("SELECT version FROM schema_info");
		if(!b.success) {
			if(!this.initializeGearshiftDB()) {
				return -1; // we couldn't set things up. 
			}
			return 0;
		}
		if(b.data.length == 0) {
			return 0;
		}
		return b.data[0].version;
	},
	migrateTo: function(target) {
		currentVersion = this.whatIsMyVersion();
		if(currentVersion == target) {
			return true; // nothing to do
		}
		
		if(currentVersion > target) {
			for(i = currentVersion; i >= target; i--) {
				rule = Gearshift.rules[i];
				rule.e = this.execSql;
				if(rule.down()) {
					this.setMyVersion(i == 0 ? 0 : (i - 1));
				} else {
					alert("Migrate down from version " + i + " failed.");
					return false;
				}
			};
		}
		if(currentVersion < target) {
			for(i = (currentVersion + 1); i <= target; i++) {
				rule = Gearshift.rules[i];
				rule.e = this.execSql;
				if(rule.up()) {
					this.setMyVersion(i);
				} else {
					alert("Migrate to version " + i + "failed.");
					return false;
				}			
			};
		}		
		// alert("Database upgraded from v" + currentVersion + " to v" + this.whatIsMyVersion());
	},
	rules: [{
		up: function() { return true; }, down: function() { return true; }
	}]
};