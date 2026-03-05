# src/pipline/io/logger.py
from __future__ import annotations

import logging
import os
import sys
import traceback
from logging.handlers import RotatingFileHandler
from datetime import datetime

_LOGGER = None  # singleton


def get_logger(log_file: str) -> logging.Logger:
    """
    Creates/returns a configured logger that logs to:
      - rotating file (primary)
      - console (optional)
    """
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    logger = logging.getLogger("nibrs_pipeline")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File (rotating)
    fh = RotatingFileHandler(
        log_file,
        maxBytes=5_000_000,   # 5MB
        backupCount=5,
        encoding="utf-8",
    )
    fh.setLevel(logging.INFO)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    # Console (nice during dev)
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    _LOGGER = logger
    return logger


def log_exception(logger: logging.Logger, where: str, exc: BaseException) -> None:
    """
    Logs full traceback + a clear header so you can grep failures fast.
    """
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error("EXCEPTION in %s: %s", where, exc)
    logger.error("TRACEBACK:\n%s", tb)


def safe_call(logger: logging.Logger, where: str, fn, *args, **kwargs):
    """
    Wrap any call and auto-log on crash. Re-raises (so your pipeline can stop).
    """
    try:
        return fn(*args, **kwargs)
    except Exception as e:
        log_exception(logger, where, e)
        raise