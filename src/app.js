import React, { useRef } from "react";
import { hot } from "react-hot-loader/root";
import { GunBoard } from "./components/GunBoard";

require("gun/lib/open");

const App = () => {
  const newId = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("board");

  if (!id) {
    return (
      <div className="new-board">
        <form
          onSubmit={e => {
            e.preventDefault();
            if (newId.current.value) {
              window.location.href = `${window.location.origin}?board=${newId.current.value}`;
            }
          }}
        >
          <input ref={newId} placeholder="(New) board ID e.g. nickstodos" />
        </form>
      </div>
    );
  }

  return <GunBoard id={id} />;
};

export default hot(App);
