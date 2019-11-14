import React, { useState, useRef } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

export const Board = ({
  getId,
  boardId,
  board,
  lanes,
  laneCards,
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

  return (
    <DragDropContext
      onDragEnd={({ source, destination, type }) => {
        if (
          !destination ||
          (source.droppableId && source.index) ===
            (destination.droppableId === destination.index)
        ) {
          return;
        }

        switch (type) {
          case "LANE":
            onMoveLane(source.index, destination.index);
            break;
          case "CARD":
            onMoveCard(
              source.droppableId,
              destination.droppableId,
              source.index,
              destination.index
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
            {(board && board.title) || boardId}
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
                      lane={lane}
                      cards={laneCards[id]}
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
  lane,
  cards,
  index,
  onSetCardTitle,
  onSetLaneTitle,
  onCreateCard
}) => {
  const id = getId(lane);
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
                      getId={getId}
                      index={i}
                      card={card}
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

const Card = ({ getId, index, card, onSetTitle }) => {
  const id = getId(card);
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
