// simple template system that looks for <%symbol%> to replace with any given string

// parse a string into a template object
// {
//    symbols: [Symbol]|null
//    error: null|error
// }
// where Symbol { name: string, loc: {int, int} }
// where error = string
// returns null on parsing failure
function parse(string) {
    // when we check for the start of a template, we can ignore the final
    // 3 characters because we know the minimum length template is <%%>
    var matches = [];
    for (var i = 0; i < string.length - 3; ++i) {
	if (string[i] == '<' &&
	    string[i + 1] == '%') {
	    var start_match = i;
            // we have a match
	    i += 2;
	    while (i < string.length && string[i] != '%' && string[i+1] != '>') {
		i += 1;
	    }
	    if (i == string.length - 1 || (string[i] != '%' && string[i+1] != '>')) {
		return {
		    error: "Missing end of template at EOF (start of match at position "
			+ start_match + ")"
		};
	    }
	    var end_match = i + 2;
	    matches.push({
		name: string.slice(start_match + 2, end_match - 2),
		loc: {
		    begin: start_match,
		    end: end_match
		},
		done: false
	    });
	}
    }
    return { source: string, symbols: matches };
}

function string_subs(str, subs_start, subs_end, new_subs) {
    return str.substring(0, subs_start) + new_subs + str.substring(subs_end, str.length);
}

function update_template_symbols(template, after, amt) {
    for (var sym of template.symbols) {
	if (sym.loc.begin > after) {
	    sym.loc.begin += amt;
	    sym.loc.end += amt;
	}
    }
}

// returns true if replacement performed or false otherwise
function replace_first_match(template, name, value) {
    for (var sym of template.symbols) {
	if (sym.name === name && !sym.done) {
	    const diff = value.length - (sym.loc.end - sym.loc.begin);
	    template.source = string_subs(template.source, sym.loc.begin, sym.loc.end, value);
	    sym.done = true;
	    update_template_symbols(template, sym.loc.begin, diff);
	    return true;
	}
    }
    return false;
}

// return true if any replacements
// otherwise false
function replace_all_matches(template, name, value) {
    var any = false;
    for (sym of template.symbols) {
	if (sym.name === name && !sym.done) {
	    any = true;
	    const diff = value.length - (sym.loc.end - sym.loc.begin);
	    template.source = string_subs(template.source, sym.loc.begin, sym.loc.end, value);
	    update_template_symbols(template, sym.loc.begin, diff);
	    sym.done = true;
	}
    }
    return any;
}


// expects pairs is an array of pairs of name, value
// returns substituted string
function subs_all(template, subs) {
    for (const sub in subs) {
	replace_all_matches(template, sub, subs[sub]);
    }

    return template.source;
}

module.exports = {
    parse,
    replace_first_match,
    replace_all_matches,
    subs_all
}
