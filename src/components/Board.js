import React, { useState, useRef } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

const getSet = (data, id, key) => {
  const entity = data[id];
  if (!entity || !entity[key]) {
    return [];
  }
  const set = data[entity[key]["#"]];
  if (!set) {
    return [];
  }
  const arr = Object.keys(set)
    .filter(key => key !== "_")
    .map(key => set[key])
    .filter(Boolean)
    .map(ref => data[ref["#"]]);
  return arr;
};

export const Board = ({
  id,
  getId,
  data,
  sort,
  onSetBoardTitle,
  onSetCardTitle,
  onMoveLane,
  onMoveCard,
  onCreateLane,
  onSetLaneTitle,
  onCreateCard
}) => {
  const [editing, setEditing] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const newLaneTitle = useRef(null);

  const board = data[id];
  const lanes = sort(getSet(data, id, "lanes"));

  return (
    <DragDropContext
      onDragEnd={({ source, destination, type, draggableId }) => {
        if (
          !destination ||
          (source.droppableId && source.index) ===
            (destination.droppableId === destination.index)
        ) {
          return;
        }

        switch (type) {
          case "LANE":
            const cleanLanes = sort(
              lanes.filter(l => getId(l) !== draggableId)
            );
            onMoveLane(
              draggableId,
              cleanLanes[destination.index - 1],
              cleanLanes[destination.index]
            );
            break;
          case "CARD":
            const cleanCards = sort(
              getSet(data, destination.droppableId, "cards").filter(
                c => getId(c) !== draggableId
              )
            );
            onMoveCard(
              draggableId,
              source.droppableId,
              destination.droppableId,
              cleanCards[destination.index - 1],
              cleanCards[destination.index]
            );
            break;
        }
      }}
    >
      <div className="board">
        {editing ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              onSetBoardTitle(newBoardTitle);
              setEditing(false);
            }}
          >
            <input
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)}
              placeholder="board title"
            />
          </form>
        ) : (
          <h1
            onDoubleClick={e => {
              setNewBoardTitle(board.title);
              setEditing(true);
            }}
            className="board-title"
          >
            {(board && board.title) || id}
          </h1>
        )}
        <div className="board-content">
          <Droppable droppableId="board" type="LANE" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className="lanes"
                {...provided.droppableProps}
              >
                {lanes.map((lane, i) => {
                  const id = getId(lane);
                  return (
                    <Lane
                      key={id}
                      getId={getId}
                      index={i}
                      id={id}
                      data={data}
                      sort={sort}
                      onSetLaneTitle={onSetLaneTitle}
                      onSetCardTitle={onSetCardTitle}
                      onCreateCard={onCreateCard}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="new-lane">
            <form
              onSubmit={e => {
                e.preventDefault();
                onCreateLane(newLaneTitle.current.value);
                newLaneTitle.current.value = "";
              }}
            >
              <input ref={newLaneTitle} placeholder="new lane" />
            </form>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

const Lane = ({
  getId,
  id,
  data,
  sort,
  index,
  onSetCardTitle,
  onSetLaneTitle,
  onCreateCard
}) => {
  const lane = data[id];
  const cards = sort(getSet(data, id, "cards"));
  const [editing, setEditing] = useState();
  const [laneTitle, setLaneTitle] = useState(lane.title);
  const newCardTitle = useRef(null);

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className="lane"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {editing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                onSetLaneTitle(laneTitle);
                setEditing(false);
              }}
            >
              <input
                autoFocus
                value={laneTitle}
                onChange={e => setLaneTitle(e.target.value)}
                placeholder="lane title"
              />
            </form>
          ) : (
            <div
              onDoubleClick={e => {
                setLaneTitle(lane.title);
                setEditing(true);
              }}
              className="lane-title"
            >
              {lane.title || "No title"}
            </div>
          )}
          <Droppable droppableId={id} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className="cards"
                {...provided.droppableProps}
              >
                {(cards || []).map((card, i) => {
                  const id = getId(card);
                  return (
                    <Card
                      key={id}
                      id={id}
                      data={data}
                      getId={getId}
                      index={i}
                      onSetTitle={onSetCardTitle}
                    />
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="new-card">
            <form
              onSubmit={e => {
                e.preventDefault();
                onCreateCard(id, newCardTitle.current.value);
                newCardTitle.current.value = "";
              }}
            >
              <input ref={newCardTitle} placeholder="new card" />
            </form>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Card = ({ getId, index, id, data, onSetTitle }) => {
  const card = data[id];
  const [editing, setEditing] = useState();
  const [cardTitle, setCardTitle] = useState(card.title);
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className="card"
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {editing ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                onSetTitle(id, cardTitle);
                setEditing(false);
              }}
            >
              <input
                autoFocus
                value={cardTitle}
                onChange={e => setCardTitle(e.target.value)}
                placeholder="card title"
              />
            </form>
          ) : (
            <div
              onDoubleClick={e => {
                setCardTitle(card.title);
                setEditing(true);
              }}
              className="card-title"
            >
              {card.title || "No title"}{" "}
              <a href={`/?board=${id}`} target="_blank" className="card-link">
                #
              </a>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
