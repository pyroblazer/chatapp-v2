import { Logger, LogLevel } from '@nestjs/common';

interface JsonLogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  metadata?: unknown;
}

export class AppLogger extends Logger {
  private isProduction(): boolean {
    return process.env.ENVIRONMENT === 'PRODUCTION';
  }

  log(message: unknown, context?: string): void;
  log(message: unknown, metadata?: unknown, context?: string): void;
  log(message: unknown, metadataOrContext?: unknown, context?: string): void {
    if (this.isProduction()) {
      const { meta, ctx } = this.resolveMetadataAndContext(metadataOrContext, context);
      this.writeJson('info', ctx, String(message), meta);
    } else {
      super.log(message, metadataOrContext as string);
    }
  }

  error(message: unknown, trace?: string, context?: string): void;
  error(message: unknown, metadata?: unknown, context?: string): void;
  error(message: unknown, metadataOrTrace?: unknown, context?: string): void {
    if (this.isProduction()) {
      const { meta, ctx } = this.resolveMetadataAndContext(metadataOrTrace, context);
      this.writeJson('error', ctx, String(message), meta);
    } else {
      super.error(message, metadataOrTrace as string, context);
    }
  }

  warn(message: unknown, context?: string): void;
  warn(message: unknown, metadata?: unknown, context?: string): void;
  warn(message: unknown, metadataOrContext?: unknown, context?: string): void {
    if (this.isProduction()) {
      const { meta, ctx } = this.resolveMetadataAndContext(metadataOrContext, context);
      this.writeJson('warn', ctx, String(message), meta);
    } else {
      super.warn(message, metadataOrContext as string);
    }
  }

  debug(message: unknown, context?: string): void;
  debug(message: unknown, metadata?: unknown, context?: string): void;
  debug(message: unknown, metadataOrContext?: unknown, context?: string): void {
    if (this.isProduction()) {
      const { meta, ctx } = this.resolveMetadataAndContext(metadataOrContext, context);
      this.writeJson('debug', ctx, String(message), meta);
    } else {
      super.debug(message, metadataOrContext as string);
    }
  }

  verbose(message: unknown, context?: string): void;
  verbose(message: unknown, metadata?: unknown, context?: string): void;
  verbose(message: unknown, metadataOrContext?: unknown, context?: string): void {
    if (this.isProduction()) {
      const { meta, ctx } = this.resolveMetadataAndContext(metadataOrContext, context);
      this.writeJson('verbose', ctx, String(message), meta);
    } else {
      super.verbose(message, metadataOrContext as string);
    }
  }

  private writeJson(level: string, context: string, message: string, metadata?: unknown): void {
    const entry: JsonLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: context || this.context || 'Application',
      message,
    };
    if (metadata !== undefined) {
      entry.metadata = metadata;
    }
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  private resolveMetadataAndContext(
    metadataOrContext?: unknown,
    context?: string,
  ): { meta: unknown; ctx: string } {
    if (typeof metadataOrContext === 'string') {
      return { meta: undefined, ctx: context || metadataOrContext };
    }
    return { meta: metadataOrContext, ctx: context || this.context || 'Application' };
  }
}
