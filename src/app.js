import React, { useRef } from "react";
import { hot } from "react-hot-loader/root";
import { GunBoard } from "./components/GunBoard";

require("gun/lib/open");

const App = () => {
  const boardId = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const board = urlParams.get("board");

  if (!board) {
    return (
      <div className="new-board">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (boardId.current.value) {
              window.location.href = `${window.location.origin}?board=${boardId.current.value}`;
            }
          }}
        >
          <input ref={boardId} placeholder="(New) board ID e.g. nickstodos" />
        </form>
      </div>
    );
  }

  return <GunBoard boardId={board} />;
};

export default hot(App);
