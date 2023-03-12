export class CircularBuffer {
    constructor(size) {
        this.size_ = size;
        this.writePosition_ = 0;
        this.data_ = new Array(size).fill(0);
    }

    enqueue(value) {
        this.data_[this.writePosition_] = value;
        this.writePosition_ = (this.writePosition_ + 1) % this.size_;
    }

    getData() {
        return this.data_.map((_, i) => this.data_[(this.writePosition_+i) % this.size_]);
    }
}
