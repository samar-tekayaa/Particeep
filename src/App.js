import React, { Component } from "react";
import { get, map } from "lodash";
import {
  Select,
  Button,
  Col,
  Row,
  List,
  Modal,
  Card,
  Statistic,
  Tooltip,
  Tag,
} from "antd";
import {
  DislikeFilled,
  LikeFilled,
  DeleteOutlined,
  FilterFilled,
  DislikeOutlined,
  LikeOutlined,
} from "@ant-design/icons";
import ReadMoreAndLess from "react-read-more-less";

import {
  deleteMovie,
  dislikeMovie,
  getFilters,
  likeMovie,
  load,
  undislikeMovie,
  unlikeMovie,
} from "./provider/MovieProvider";
import { createPortal } from "react-dom";

const { confirm } = Modal;

export default class App extends Component {
  state = {
    movies: [],
    pagination: {
      current: 1,
      pageSize: 4,
      size: "small",
      pageSizeOptions: [4, 8, 12],
      showSizeChanger: true,
    },
    categories: [],
    filter: null,
    loading: null,
  };
  categories = [];

  componentDidMount() {
    this._loadData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      prevState.categories.length &&
      this.state.loading === prevState.loading
    ) {
      this._loadData();
    }
  }

  _loadFilters() {
    return getFilters();
  }

  _loadData() {
    this.setState({ loading: true });
    return load(this.state.pagination, this.state.filter).then((movies) =>
      this._loadFilters().then((categories) => {
        console.log("categories", categories);
        this.setState({
          loading: false,
          categories,
          movies: {
            ...movies,
            results: map(movies.results, (movie) => {
              movie.key = movie.id;
              return movie;
            }),
          },
        });
      })
    );
  }

  _delete(id) {
    confirm({
      title: "Êtes-vous sûrs de vouloir supprimer ce film ?",
      onOk: () => deleteMovie(id).then(this._loadData.bind(this)),
      onCancel() {},
      okText: "Oui",
      cancelText: "Non",
    });
  }

  paginate = (current, pageSize) => {
    const pagination = {
      ...this.state.pagination,
      current,
      pageSize,
      total: get(this.state.movies, "total", 0),
      onChange: this.paginate.bind(this),
    };

    console.log("pagination", pagination);
    this.setState({ pagination });
  };

  _handleChange = (categories) => {
    this.categories = categories;
  };

  filter() {
    const pagination = {
      ...this.state.pagination,
      current: 1,
      total: get(this.state.movies, "total", 0),
      onChange: this.paginate.bind(this),
    };
    const filter =
      this.categories && this.categories.length
        ? { category: this.categories }
        : null;

    this.setState({ pagination, filter });
  }

  _likeToggle(item) {
    console.log("item.liked", item.liked);
    return Promise.resolve(
      item.liked ? unlikeMovie(item.id) : likeMovie(item.id)
    ).then(this._loadData.bind(this));
  }

  _dislikeToggle(item) {
    return Promise.resolve(
      item.disliked ? undislikeMovie(item.id) : dislikeMovie(item.id)
    ).then(this._loadData.bind(this));
  }

  render() {
    const pagination = {
      ...this.state.pagination,
      total: get(this.state.movies, "total", 0),
      onChange: this.paginate.bind(this),
      onShowSizeChange: this.paginate.bind(this),
    };
    return (
      <>
        <Row>
          <Col
            span={24}
            style={{ padding: 20, flexDirection: "row", display: "flex" }}
          >
            <Select
              style={{ flex: 1 }}
              mode="multiple"
              placeholder="Filtrer la liste"
              onChange={this._handleChange.bind(this)}
            >
              {this.state.categories.map((item) => (
                <Select.Option key={item} value={item}>
                  {item}
                </Select.Option>
              ))}
            </Select>
            <Tooltip title="Filtrer">
              <Button
                onClick={this.filter.bind(this)}
                icon={<FilterFilled />}
              />
            </Tooltip>
          </Col>
        </Row>
        <List
          grid={{ gutter: 16, column: 2 }}
          style={{ padding: 20 }}
          loading={this.state.loading}
          dataSource={this.state.movies.results}
          pagination={pagination}
          itemLayout="horizontal"
          renderItem={(item) => (
            <List.Item>
              <Card
                title={
                  <h3>
                    {item.title}
                    <Tag style={{ marginLeft: 10 }}>{item.category}</Tag>
                  </h3>
                }
                extra={
                  <>
                    <Tooltip title="Supprimer">
                      <Button
                        onClick={() => this._delete(item.id)}
                        shape="circle"
                        icon={<DeleteOutlined />}
                      />
                    </Tooltip>
                    <Tooltip title="J'aime">
                      <Button
                        type={item.liked ? "primary" : "default"}
                        onClick={() => this._likeToggle(item)}
                        style={{ marginLeft: 5 }}
                        shape="circle"
                        icon={item.liked ? <LikeFilled /> : <LikeOutlined />}
                      />
                    </Tooltip>
                    <Tooltip title="Je déteste">
                      <Button
                        type={item.disliked ? "primary" : "default"}
                        onClick={() => this._dislikeToggle(item)}
                        style={{ marginLeft: 5 }}
                        shape="circle"
                        icon={
                          item.disliked ? (
                            <DislikeFilled />
                          ) : (
                            <DislikeOutlined />
                          )
                        }
                      />
                    </Tooltip>
                  </>
                }
              >
                <List.Item.Meta
                  avatar={
                    <img
                      alt={item.title}
                      src={item.poster}
                      style={{ width: 92 }}
                    />
                  }
                  description={
                    <>
                      <Row>
                        <Statistic
                          value={item.likes}
                          style={{ margin: 10 }}
                          prefix={<LikeFilled />}
                        />
                        <Statistic
                          value={item.dislikes}
                          style={{ margin: 10 }}
                          prefix={<DislikeFilled />}
                        />
                      </Row>
                      <Row>
                        <Col span={24}>
                          <ReadMoreAndLess
                            ref={this.ReadMore}
                            className="movie-overview"
                            charLimit={100}
                            readMoreText="Lire plus"
                            readLessText="Lire moins"
                          >
                            {item.overview}
                          </ReadMoreAndLess>
                        </Col>
                      </Row>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </>
    );
  }
}
