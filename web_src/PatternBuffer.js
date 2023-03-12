export class PatternBuffer {
    constructor() {
        this.data_ = [];
    }

    push(data) {
        this.data_.push(...data);
    }

    getMatchingPatternsAndTrim(headerData, patternLength) {
        const matchingPatterns = this.getMatchingPatterns(headerData, patternLength);
        if (matchingPatterns.length > 0)
            this.trim(matchingPatterns[matchingPatterns.length-1].index+patternLength);
        return matchingPatterns.reduce((acc, data) => {
            acc.push(data.data);
            return acc;
        }, []);
    }

    getMatchingPatterns(headerData, patternLength) {
        return this.data_.reduce((acc, _, i) => {
            if (i + patternLength > this.data_.length) return acc;
            const foundMatch = headerData.reduce((match, headerValue, j) => match && headerValue === this.data_[i+j], true);
            if (foundMatch)
                acc.push({index: i, data: this.data_.slice(i+headerData.length, i+patternLength)});   // Keep only the data (i.e. drop the header)
            return acc;
        }, []);
    }

    trim(index) {
        this.data_ = this.data_.slice(index);
    }
}
