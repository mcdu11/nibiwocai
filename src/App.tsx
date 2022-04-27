import { Button, Drawer, Grid, TextField } from "@material-ui/core";
import {
  ArrowForward,
  Cancel,
  CheckCircle
} from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import { useCountdown } from "usehooks-ts";
import "./App.css";
import { useRandomWord } from "./hooks/useRandomWord";

function App() {
  const [intervalValue] = useState<number>(1000);
  const [seconds, setSeconds] = useState<number>(60);
  const [count, { start, stop, reset }] = useCountdown({
    seconds,
    interval: intervalValue,
    isIncrement: false,
  });

  const [showRecords, setShowRecords] = useState(false);

  const { word, setWord, getRandomWord, libRecords, setLibRecords } =
    useRandomWord();

  useEffect(() => {
    if (count === 0) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  useEffect(() => {
    const w = getRandomWord();
    setWord(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    const w = getRandomWord();
    setWord(w);
  };

  const handleOpreate = (pass?: boolean) => {
    if (!word) {
      return;
    }
    // 记录当前的 词条
    setLibRecords((pre) => {
      pre.push({
        word: word,
        pass,
      });

      return pre;
    });

    setTimeout(() => {
      handleNext();
    }, 10);
  };

  const clearRecord = () => {
    setLibRecords([]);
  };

  const hasRecords = !!libRecords.length;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-count">
          <span>{count}</span>
          <TextField
            id="standard-number"
            label="设置倒计时时长"
            type="number"
            value={seconds}
            onChange={(e) => {
              console.log(e.target.value);
              setSeconds(Number(e.target.value));
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </div>

        <div className="main">
          <span>{word || "没有词条了"}</span>
        </div>

        <Grid
          container
          spacing={3}
          style={{ flexGrow: 0, width: "100%", margin: 0 }}
        >
          <Grid item xs={4}></Grid>
          <Grid item xs={4}>
            <div className="timer-ctrl">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={start}
              >
                开始
              </Button>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                onClick={stop}
              >
                暂停
              </Button>
              <Button size="large" variant="contained" onClick={reset}>
                重置
              </Button>
            </div>
          </Grid>
          <Grid item xs={4}>
            <div className="word-ctrl">
              <Button
                size="large"
                variant="contained"
                color="primary"
                onClick={() => handleOpreate(true)}
              >
                正确
              </Button>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                onClick={() => handleOpreate(false)}
              >
                错误
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={() => handleOpreate(undefined)}
              >
                跳过
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={() => setShowRecords(true)}
              >
                查看记录
              </Button>
            </div>
          </Grid>
        </Grid>
      </header>
      <Drawer
        anchor={"right"}
        open={showRecords}
        onClose={() => {
          setShowRecords(false);
        }}
      >
        {hasRecords ? (
          <>
            <div style={{ marginLeft: 20 }}>
              <div>
                正确：{libRecords?.filter((item) => item.pass === true)?.length}
              </div>
              <div>
                错误：
                {libRecords?.filter((item) => item.pass === false)?.length}
              </div>
              <div>
                跳过：
                {libRecords?.filter((item) => item.pass === undefined)?.length}
              </div>
            </div>
            {libRecords.map((record) => {
              return (
                <div
                  style={{
                    width: 250,
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ display: "inline-block", width: "150px" }}>
                    {record.word}:
                  </span>
                  {record.pass && <CheckCircle color="primary" />}
                  {record.pass === false && <Cancel color="error" />}
                  {record.pass === undefined && (
                    <ArrowForward color="primary" />
                  )}
                </div>
              );
            })}
            <Button
              size="large"
              variant="contained"
              color="secondary"
              style={{ width: "50%", marginLeft: 20 }}
              onClick={() => clearRecord()}
            >
              清除记录
            </Button>
          </>
        ) : (
          <div style={{ width: 250, padding: "20px" }}>暂无记录</div>
        )}
      </Drawer>
    </div>
  );
}

export default App;
